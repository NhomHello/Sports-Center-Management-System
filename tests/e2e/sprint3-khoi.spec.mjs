import { SETTING_KEYS as K } from '@scms/shared';
import { updateMany } from '../../core/be/src/modules/setting/setting.service.js';
import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { api, apiPath, bearer } from '../../core/be/tests/helpers/api.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  buyOnline,
  sendTransfer,
  latestCase,
  asManager,
} from '../../core/be/tests/helpers/reconciliation.js';
import { login } from './helpers/ui.mjs';

let bankSettings;
let f;
test.beforeAll(async () => {
  bankSettings = await prisma.systemSetting.findMany({
    where: { key: { in: [K.PAYMENT_BANK_CODE, K.PAYMENT_ACCOUNT_NUMBER] } },
  });
  await updateMany(
    [
      { key: K.PAYMENT_BANK_CODE, value: 'ACB' },
      { key: K.PAYMENT_ACCOUNT_NUMBER, value: '0000000000' },
    ],
    { id: (await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } })).id },
  );
});
test.afterAll(async () => {
  if (bankSettings)
    await updateMany(
      bankSettings.map(({ key, value }) => ({ key, value })),
      { id: (await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } })).id },
    );
});
let invoice;
const receipt = (page) => page.getByRole('dialog').filter({ hasText: 'Chi tiết hóa đơn' });
const contact = (id) =>
  asManager(f, 'post', `/reconciliations/${id}/contacts`, {
    channel: 'PHONE',
    content: 'Đã gọi xác nhận thông tin ngân hàng',
    result: 'Đã xác nhận',
  });
const capture = (page, info, name) =>
  page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
async function openInvoice(page, user = f.member) {
  await login(page, user, user.id === f.admin.id ? env.SEED_ADMIN_PASSWORD : f.password);
  await page.goto(`/payments?invoice=${invoice.id}`);
  await expect(receipt(page).getByText(invoice.code).first()).toBeVisible();
}
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Nghiệm thu SePay ở 1366×900 theo S3-68');
  f = await createReconciliationFixture();
  f.admin = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  invoice = await buyOnline(f);
});
test.afterEach(async () => {
  if (f) await cleanupReconciliationFixture(f);
  f = undefined;
});

test('S3-68: thiếu tiền → QR chuyển bù → PAID → in PDF', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const underpaid = await sendTransfer(f, invoice, { transferAmount: 100000 });
  expect(underpaid.outcome).toBe('UNDERPAID');
  await openInvoice(page);
  await expect(receipt(page).getByText('Cần chuyển bù', { exact: true })).toBeVisible();
  await expect(receipt(page).getByText(/Đã nhận 100.000/)).toBeVisible();
  const qr = receipt(page).getByAltText('Mã QR chuyển khoản');
  await expect(qr).toBeVisible();
  expect(new URL(await qr.getAttribute('src')).searchParams.get('amount')).toBe('200000');
  await expect(receipt(page).getByRole('button', { name: 'In / lưu PDF' })).toBeDisabled();
  await capture(page, info, 'chuyen-bu');
  expect((await sendTransfer(f, invoice, { transferAmount: 200000 })).outcome).toBe('PAID');
  await expect(
    receipt(page).getByText('Đã nhận thanh toán. Gói tập đã được kích hoạt.'),
  ).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await openInvoice(page, f.admin);
  await expect(receipt(page).getByRole('button', { name: 'In', exact: true })).toBeEnabled();
  await page.evaluate(() => {
    window.__printed = false;
    window.print = () => {
      window.__printed = true;
    };
  });
  await receipt(page).getByRole('button', { name: 'In', exact: true }).click();
  expect(await page.evaluate(() => window.__printed)).toBe(true);
  await capture(page, info, 'da-thanh-toan');
  expect(errors).toEqual([]);
});

test('S3-68: sai mã → quản lý map → hội viên thấy PAID', async ({ page }, info) => {
  const result = await sendTransfer(f, null, { transferAmount: invoice.amount });
  const kase = await latestCase(f, { webhookLogId: result.logId });
  expect(kase.reason).toBe('NO_MATCH');
  await contact(kase.id);
  expect(
    (await asManager(f, 'post', `/reconciliations/${kase.id}/map`, { invoiceId: invoice.id }))
      .status,
  ).toBe(200);
  await openInvoice(page);
  await expect(receipt(page).getByText('Đã thanh toán', { exact: true })).toBeVisible();
  await capture(page, info, 'sai-ma-da-map');
});

test('S3-68: chuyển thừa và chuyển hai lần → liên hệ → hoàn phần dư', async ({ page }, info) => {
  expect((await sendTransfer(f, invoice, { transferAmount: invoice.amount + 50000 })).outcome).toBe(
    'OVERPAID',
  );
  // BR-PAY-06: chuyển thừa giữ hóa đơn chờ; quản lý liên hệ rồi chấp nhận mới PAID.
  const overpaid = await latestCase(f, { invoiceId: invoice.id, reason: 'OVERPAID' });
  expect((await contact(overpaid.id)).status).toBe(201);
  expect((await asManager(f, 'post', `/reconciliations/${overpaid.id}/accept`)).status).toBe(200);
  await sendTransfer(f, invoice);
  const cases = await prisma.reconciliationCase.findMany({ where: { invoiceId: invoice.id } });
  expect(cases.map((c) => c.reason)).toContain('OVERPAID');
  expect(cases.map((c) => c.reason)).toContain('DUPLICATE_TRANSFER');
  for (const kase of cases) {
    f.caseIds.push(kase.id);
    if (kase.id !== overpaid.id) expect((await contact(kase.id)).status).toBe(201);
    const res = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
      reason: 'Trả khoản chuyển dư / chuyển lặp',
    });
    expect(res.status).toBe(201);
    expect(
      (
        await asManager(f, 'post', `/refunds/${res.body.data.id}/complete`, {
          reference: `RETURN-${kase.id}`,
        })
      ).status,
    ).toBe(200);
  }
  await openInvoice(page);
  await expect(receipt(page).getByText('Đã thanh toán', { exact: true })).toBeVisible();
  await capture(page, info, 'chuyen-thua-chuyen-lap');
});

test('S3-63/68: hội viên báo đã chuyển → phiếu duy nhất → quản lý duyệt', async ({
  page,
}, info) => {
  await openInvoice(page);
  await receipt(page).getByRole('button', { name: 'Tôi đã chuyển khoản' }).click();
  const claim = page.getByRole('dialog').filter({ hasText: 'Tôi đã chuyển khoản' });
  await claim.getByLabel('Thời điểm chuyển (giờ Việt Nam)').fill('14/10/2026 12:00');
  await claim.getByLabel('Thời điểm chuyển (giờ Việt Nam)').press('Tab');
  await claim.getByLabel('Số tiền đã chuyển').fill(String(invoice.amount));
  await claim.getByLabel('Ngân hàng chuyển').fill('ACB');
  await claim.getByLabel('Mã giao dịch', { exact: true }).fill('MEMBER-CLAIM-TEST');
  await claim.getByRole('button', { name: 'Gửi để đối chiếu' }).click();
  await expect(claim.getByText('Đã gửi phiếu đối chiếu', { exact: true })).toBeVisible();
  const kase = await latestCase(f, { invoiceId: invoice.id, reason: 'MEMBER_CLAIM' });
  expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe(
    'PENDING',
  );
  const duplicate = await api
    .post(apiPath(`/invoices/${invoice.id}/claims`))
    .set(bearer(f.memberToken))
    .send({ transferredAt: new Date(), amount: invoice.amount, bankName: 'ACB' });
  expect(duplicate.status).toBe(409);
  await capture(page, info, 'bao-da-chuyen');
  expect((await contact(kase.id)).status).toBe(201);
  expect(
    (
      await asManager(f, 'post', `/reconciliations/${kase.id}/confirm`, {
        amount: invoice.amount,
        reference: 'VERIFIED-STATEMENT',
      })
    ).status,
  ).toBe(200);
  await page.goto(`/payments?invoice=${invoice.id}`);
  await expect(receipt(page).getByText('Đã thanh toán', { exact: true })).toBeVisible();
});

test('S3-23: quản lý tạo hoàn → xác nhận chuyển trả; báo cáo tải đủ định dạng', async ({
  page,
}, info) => {
  await sendTransfer(f, invoice);
  await openInvoice(page, f.admin);
  await receipt(page).getByRole('button', { name: 'Hoàn tiền', exact: true }).click();
  const refund = page.getByRole('dialog').filter({ hasText: 'Hoàn tiền hóa đơn' });
  await refund.getByLabel('Lý do hoàn').fill('Hội viên yêu cầu hoàn gói');
  await refund.getByRole('button', { name: 'Tạo yêu cầu hoàn' }).click();
  await expect(refund.getByText('Yêu cầu đã tạo, đang chờ chuyển trả')).toBeVisible();
  await refund.getByLabel('Mã tham chiếu chuyển trả').fill('BANK-RETURN-TEST');
  await refund.getByRole('button', { name: 'Xác nhận đã chuyển trả' }).click();
  await expect(refund).not.toBeVisible();
  await expect(receipt(page).getByText('Đã hoàn tiền', { exact: true })).toBeVisible();
  await capture(page, info, 'hoan-tien');
  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'Báo cáo trung tâm' })).toBeVisible();
  for (const format of ['CSV', 'XLSX', 'PDF']) {
    await page.getByRole('combobox', { name: 'Định dạng báo cáo' }).click();
    await page.getByTitle(format, { exact: true }).click();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất báo cáo' }).click();
    expect((await download).suggestedFilename()).toMatch(new RegExp(`\\.${format.toLowerCase()}$`));
  }
  await capture(page, info, 'bao-cao');
});
