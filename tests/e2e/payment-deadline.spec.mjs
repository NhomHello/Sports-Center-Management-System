import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
} from '../../core/be/tests/helpers/reconciliation.js';
import { boundaryInvoice, bankDate } from '../../core/be/tests/helpers/payment-deadline.js';

const apiRoot = `http://127.0.0.1:${process.env.E2E_API_PORT || '3100'}${env.API_PREFIX}`;
let f;
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Luồng thu tiền và giữ chỗ desktop');
  f = await createReconciliationFixture();
});
test.afterEach(async () => cleanupReconciliationFixture(f));
async function showInvoice(page, token, id) {
  await page.addInitScript(
    (value) =>
      localStorage.setItem(
        'scms.auth',
        JSON.stringify({
          state: { accessToken: value },
          version: 0,
        }),
      ),
    token,
  );
  await page.goto(`/payments?invoice=${id}`);
}

test('TC-PAY-DEADLINE-E2E: QR dừng đúng hạn, webhook tiền đúng hạn vẫn xác nhận trong grace', async ({
  page,
  request,
}) => {
  const invoice = await boundaryInvoice(f, { seconds: 8 });
  await showInvoice(page, f.memberToken, invoice.id);
  await expect(page.getByAltText('Mã QR chuyển khoản')).toBeVisible();
  await expect(
    page.getByText('Hết hạn chuyển tiền, đang chờ xác nhận ngân hàng', { exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByAltText('Mã QR chuyển khoản')).toHaveCount(0);
  const id = `deadline-e2e-${Date.now()}`;
  f.sepayIds.push(id);
  const paid = await request.post(`${apiRoot}/payments/sepay/webhook`, {
    headers: { Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` },
    data: {
      id,
      transferType: 'in',
      transferAmount: invoice.amount,
      code: invoice.code,
      transactionDate: bankDate(new Date(invoice.expiresAt.getTime() - 1000)),
    },
  });
  expect(paid.status()).toBe(200);
  expect((await paid.json()).data.outcome).toBe('PAID');
  await expect(
    page.getByText('Đã nhận thanh toán. Khóa học đã có hiệu lực.', { exact: true }),
  ).toBeVisible();
});

test('TC-COUNTER-DEADLINE-E2E: modal đang mở cũng khóa nút thu khi hết hạn', async ({ page }) => {
  const invoice = await boundaryInvoice(f, { channel: 'COUNTER', seconds: 8 });
  await showInvoice(page, f.adminToken, invoice.id);
  await page.getByRole('button', { name: 'Thu tiền mặt', exact: true }).click();
  const collect = page.getByRole('button', { name: 'Đã nhận đủ tiền', exact: true });
  await expect(collect).toBeEnabled();
  await expect(collect).toBeDisabled({ timeout: 15000 });
  await expect(
    page.getByRole('dialog').filter({ has: collect }).getByText('Hết hạn giữ chỗ', { exact: true }),
  ).toBeVisible();
  expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(0);
});
