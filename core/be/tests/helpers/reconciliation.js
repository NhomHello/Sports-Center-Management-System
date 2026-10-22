import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { cleanupSprintFixture, createSprintFixture } from './sprint1.js';

const getApi = () => import('./api.js');
const WEBHOOK_PATH = '/payments/sepay/webhook';
const SEPAY_AUTH = { Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` };
// Giá trị giả lập cho payload test, không phải số nghiệp vụ.
const ID_SPREAD = 100000;
const DEFAULT_AMOUNT = 1000;
const REF_LENGTH = 8;

/** Bộ test đối soát: hai hội viên, một gói riêng, theo dõi id SePay và phiếu để dọn sạch. */
export const createReconciliationFixture = async ({ withApi = true } = {}) => {
  const fixture = await createSprintFixture({ withApi });
  const plan = await prisma.membershipPlan.create({
    data: { code: fixture.prefix, name: fixture.prefix, price: 300000, durationDays: 30 },
  });
  const renewal = await prisma.membershipPlan.create({
    data: {
      code: `${fixture.prefix}_R`,
      name: `${fixture.prefix} R`,
      price: 300000,
      durationDays: 10,
    },
  });
  return { ...fixture, plan, renewal, sepayIds: [], caseIds: [], startedAt: new Date() };
};

/** Dọn phiếu, hoàn tiền, log webhook và cảnh báo gửi cho người đối soát trong lúc chạy test. */
export const cleanupReconciliationFixture = async (f) => {
  if (!f) return;
  const invoices = await prisma.invoice.findMany({
    where: { userId: { in: f.userIds } },
    select: { id: true },
  });
  const invoiceIds = invoices.map((item) => item.id);
  const caseWhere = {
    OR: [
      { id: { in: f.caseIds } },
      { userId: { in: f.userIds } },
      { invoiceId: { in: invoiceIds } },
    ],
  };
  const cases = await prisma.reconciliationCase.findMany({
    where: caseWhere,
    select: { id: true },
  });
  const ids = cases.map((item) => item.id);
  await prisma.refund.deleteMany({
    where: { OR: [{ caseId: { in: ids } }, { invoiceId: { in: invoiceIds } }] },
  });
  await prisma.reconciliationCase.deleteMany({ where: { id: { in: ids } } });
  await prisma.paymentWebhookLog.deleteMany({
    where: { providerTransactionId: { in: f.sepayIds } },
  });
  await prisma.notification.deleteMany({
    where: { kind: 'PAYMENT_REVIEW_ALERT', createdAt: { gte: f.startedAt } },
  });
  await prisma.auditLog.deleteMany({
    where: { userId: null, entity: 'Invoice', createdAt: { gte: f.startedAt } },
  });
  await cleanupSprintFixture(f);
  await prisma.membershipPlan.deleteMany({ where: { id: { in: [f.plan.id, f.renewal.id] } } });
};

/** Hội viên tự mua gói online, trả về hoá đơn PENDING. */
export const buyOnline = async (f, token = f.memberToken, planId = f.plan.id) => {
  const { api, apiPath, bearer } = await getApi();
  return (await api.post(apiPath('/memberships/me/orders')).set(bearer(token)).send({ planId })).body
    .data;
};

/** Gửi một webhook tiền vào; mặc định đúng mã và đúng số tiền của hoá đơn. */
export const sendTransfer = async (f, invoice, overrides = {}) => {
  const id = `${Date.now()}${Math.floor(Math.random() * ID_SPREAD)}`;
  f.sepayIds.push(id);
  const body = {
    id,
    gateway: 'ACB',
    transferType: 'in',
    transferAmount: invoice?.amount ?? DEFAULT_AMOUNT,
    code: invoice?.code ?? null,
    content: invoice ? `Thanh toan ${invoice.code}` : 'chuyen tien',
    referenceCode: `FT${randomUUID().slice(0, REF_LENGTH)}`,
    ...overrides,
  };
  const { api, apiPath } = await getApi();
  const res = await api.post(apiPath(WEBHOOK_PATH)).set(SEPAY_AUTH).send(body);
  return res.body.data;
};

/** Phiếu đối soát mới nhất của hoá đơn (hoặc của log webhook khi không có hoá đơn). */
export const latestCase = async (f, where) => {
  const kase = await prisma.reconciliationCase.findFirst({ where, orderBy: { id: 'desc' } });
  if (kase) f.caseIds.push(kase.id);
  return kase;
};

/** Gọi API đối soát bằng tài khoản quản lý. */
export const asManager = async (f, method, path, body) => {
  const { api, apiPath, bearer } = await getApi();
  return api[method](apiPath(path)).set(bearer(f.adminToken)).send(body);
};
