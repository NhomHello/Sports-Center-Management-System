import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  buyOnline,
  sendTransfer,
  latestCase,
} from '../../core/be/tests/helpers/reconciliation.js';
import { login } from './helpers/ui.mjs';
let f;
let invoice;
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop');
  f = await createReconciliationFixture();
  f.admin = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  invoice = await buyOnline(f);
});
test.afterEach(async () => {
  await cleanupReconciliationFixture(f);
  f = undefined;
});
async function openCase(page, reason) {
  const kase = await latestCase(f, { invoiceId: invoice.id, reason });
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  await page.goto('/reconciliation');
  await page
    .locator('.ant-table-row')
    .filter({ hasText: invoice.code })
    .getByRole('button', { name: 'Xem phiếu' })
    .click();
  return kase;
}
async function contact(page) {
  const drawer = page.locator('.ant-drawer');
  await drawer.getByLabel('Kênh liên hệ', { exact: true }).click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText('Điện thoại', { exact: true })
    .click();
  await drawer
    .getByLabel('Nội dung và ý kiến hội viên', { exact: true })
    .fill('Đã liên hệ, hội viên đồng ý hoàn phần thừa.');
  await drawer.getByRole('button', { name: 'Ghi lần liên hệ' }).click();
  await expect(drawer.locator('.ant-timeline')).toContainText('Đã liên hệ');
}
test('TC-S3-KPAY-01: manager records a top-up with a bank reference', async ({ page }, info) => {
  await sendTransfer(f, invoice, { transferAmount: invoice.amount - 1000 });
  await openCase(page, 'UNDERPAID');
  const drawer = page.locator('.ant-drawer');
  await drawer.getByLabel('Số tiền thực nhận (VND)', { exact: true }).fill('1000');
  await drawer.getByLabel('Mã tham chiếu ngân hàng', { exact: true }).fill(`TEST_${f.prefix}`);
  await drawer.getByRole('button', { name: 'Xác nhận thanh toán', exact: true }).click();
  await expect(drawer.getByText('Đã đối soát', { exact: true })).toBeVisible();
  expect((await prisma.invoice.findUnique({ where: { id: invoice.id } })).status).toBe('PAID');
  await page.screenshot({ path: info.outputPath('confirmed.png'), fullPage: true });
});
test('TC-S3-KPAY-02: excess refund requires contact and preserves PAID invoice', async ({
  page,
}, info) => {
  await sendTransfer(f, invoice, { transferAmount: invoice.amount + 1000 });
  const kase = await openCase(page, 'OVERPAID');
  const drawer = page.locator('.ant-drawer');
  await expect(drawer.getByRole('button', { name: 'Tạo yêu cầu hoàn tiền' })).toBeDisabled();
  await contact(page);
  await drawer
    .getByLabel('Lý do hoàn tiền', { exact: true })
    .fill('Hội viên yêu cầu hoàn phần thừa');
  await drawer.getByRole('button', { name: 'Tạo yêu cầu hoàn tiền' }).click();
  await expect(drawer.getByText('Chờ hoàn tiền', { exact: true })).toBeVisible();
  expect((await prisma.refund.findFirst({ where: { caseId: kase.id } })).amount).toBe(1000);
  expect((await prisma.invoice.findUnique({ where: { id: invoice.id } })).status).toBe('PAID');
  await page.screenshot({ path: info.outputPath('excess.png'), fullPage: true });
});
test('TC-S3-KPAY-03: member downloads own PAID receipt PDF', async ({ page }, info) => {
  await sendTransfer(f, invoice);
  await login(page, f.member, f.password);
  await page.goto(`/payments?invoice=${invoice.id}`);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Ba trăm nghìn đồng')).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Tải PDF', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe(`${invoice.code}.pdf`);
  await page.screenshot({ path: info.outputPath('receipt.png'), fullPage: true });
});
