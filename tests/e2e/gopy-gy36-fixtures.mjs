import { fileURLToPath } from 'node:url';

export const NOW = '2026-10-21T03:00:00.000Z';
const initialContext = () => ({
  membership: {
    id: 11,
    userId: 1,
    planId: 31,
    plan: { id: 31 },
    invoiceId: 101,
    status: 'ACTIVE',
    startDate: NOW,
    endDate: '2027-03-01T00:00:00.000Z',
    freezeDaysUsed: 20,
    freezeDaysLeft: 40,
    freezes: [],
  },
  course: {
    id: 21,
    name: 'Yoga đã mua',
    enrollment: { id: 41, memberId: 1, status: 'BOOKED', invoiceId: 201 },
  },
  invoice: {
    id: 101,
    userId: 1,
    amount: 290000,
    status: 'PENDING',
    paymentInstruction: { amount: 290000 },
  },
  session: {
    id: 51,
    status: 'SCHEDULED',
    startAt: '2026-10-23T11:00:00.000Z',
    excuseDeadline: '2026-10-22T23:00:00.000Z',
    canExcuse: true,
  },
});

const envelope = (data) => ({ success: true, data });
const preview = {
  paidAmount: 1200000,
  remainingValue: 800000,
  fee: 80000,
  refundAmount: 720000,
  beforeStart: false,
};

/** Dữ liệu theo hợp đồng, không khẳng định server thật đã có các API này. */
export async function openFixture(page, options = {}) {
  const context = { ...initialContext(), ...options };
  if (options.expired)
    context.session = { ...context.session, excuseDeadline: '2026-10-20T00:00:00Z' };
  if (options.noDeadline) context.session = { ...context.session, excuseDeadline: undefined };
  const state = {
    context,
    balance: options.balance ?? 0,
    entries: [],
    requests: [],
    errors: [],
    preview,
  };
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.clock.install({ time: new Date(NOW) });
  await page.route('**/__gopy-khoi-fixture', (route) => {
    const modulePath = fileURLToPath(
      new URL('./gopy-gy36-harness.jsx', import.meta.url),
    ).replaceAll('\\', '/');
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script>window.__GOPY_CONTEXT__=${JSON.stringify(context)};</script><script type="module">import RefreshRuntime from '/@react-refresh'; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (type) => type; window.__vite_plugin_react_preamble_installed__ = true; await import('/@fs/${modulePath}');</script></body></html>`,
    });
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ path, method, body, search: url.search });
    const respond = (data, status = 200) =>
      route.fulfill({ status, json: status === 200 ? envelope(data) : data });
    if (method === 'GET') return handleRead({ state, path, url, respond, options });
    if (path.endsWith('/excuse')) return respond({ id: 1, status: 'EXCUSED', memberId: 1 });
    if (path.endsWith('/cancel')) {
      if (options.cancelError) return respond({ message: 'Khóa đã kết thúc, không thể hủy' }, 422);
      state.context.course.enrollment.status = 'CANCELLED';
      if (body.settlement === 'CREDIT') {
        state.balance += state.preview.refundAmount;
        state.entries.push({
          id: 1,
          amount: 720000,
          balanceAfter: 720000,
          reason: 'CANCELLATION',
          createdAt: NOW,
        });
      }
      return respond({ id: 61, status: 'DONE', settlement: body.settlement });
    }
    if (path.endsWith('/apply-credit')) {
      if (options.creditError)
        return respond({ message: 'Số dư đã thay đổi, vui lòng tải lại' }, 409);
      state.balance = 430000;
      state.context.invoice = {
        ...state.context.invoice,
        status: 'PAID',
        paymentInstruction: { amount: 0 },
      };
      return respond(state.context.invoice);
    }
    if (path.endsWith('/change'))
      return respond({ id: 62, status: 'PENDING_PAYMENT', adjustmentInvoiceId: 301 });
    if (path.endsWith('/freezes/resume')) {
      state.context.membership = {
        ...state.context.membership,
        status: 'ACTIVE',
        freezeDaysUsed: 22,
        freezeDaysLeft: 38,
        freezes: state.context.membership.freezes.map((entry) => ({
          ...entry,
          endedAt: NOW,
          creditedDays: 2,
        })),
      };
      return respond(state.context.membership);
    }
    if (path.endsWith('/freezes')) {
      state.context.membership = {
        ...state.context.membership,
        status: 'FROZEN',
        freezes: [
          {
            id: 71,
            startAt: `${body.from}T00:00:00+07:00`,
            endAt: `${body.to}T00:00:00+07:00`,
            endedAt: null,
            creditedDays: null,
          },
        ],
      };
      return respond(state.context.membership.freezes[0]);
    }
    return respond({ message: `Không khai báo fixture: ${method} ${path}` }, 404);
  });
  await page.goto('/__gopy-khoi-fixture');
  await page.getByRole('heading', { name: 'Kiểm thử hợp đồng FE Khôi' }).waitFor();
  return state;
}

function handleRead({ state, path, url, respond, options }) {
  if (path === '/memberships/11') return respond(state.context.membership);
  if (path === '/classes/21') return respond(state.context.course);
  if (path === '/invoices/101') return respond(state.context.invoice);
  if (path.endsWith('/credit')) return respond({ balance: state.balance, items: state.entries });
  if (path.endsWith('/cancel-preview')) {
    if (options.previewError) return respond({ message: 'Không được hủy giao dịch này' }, 422);
    return respond(options.badPreview ? { fee: '80000' } : state.preview);
  }
  if (path.endsWith('/change-preview'))
    return respond({
      remainingValue: 800000,
      newPrice: options.returnMoney ? 600000 : 1500000,
      difference: options.returnMoney ? -200000 : 700000,
    });
  if (path === '/classes')
    return respond([
      { id: 21, name: 'Yoga đã mua', seatsRemaining: 2 },
      { id: 22, name: 'Yoga mới còn chỗ', seatsRemaining: 3 },
      { id: 23, name: 'Yoga đã đầy', seatsRemaining: 0 },
    ]);
  if (path === '/membership-plans')
    return respond([
      { id: 31, name: 'Gói cũ' },
      { id: 32, name: 'Gói mới' },
    ]);
  return respond({ message: `Không khai báo fixture: GET ${path} ${url.search}` }, 404);
}
