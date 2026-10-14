import { SETTING_KEYS as K } from '@scms/shared';
import { updateMany } from '../../core/be/src/modules/setting/setting.service.js';
import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { createSprintFixture, cleanupSprintFixture } from '../../core/be/tests/helpers/sprint1.js';
import { login } from './helpers/ui.mjs';

const SHOTS = 'outputs/sepay-nghiem-thu';
const PRICE = 450000;
let f;
let plan;
let webhookUrl;

let bankSettings;
/** Mặc định dùng API kiểm thử; smoke qua tunnel có thể đặt E2E_WEBHOOK_URL. */
async function resolveWebhookUrl() {
  return (
    process.env.E2E_WEBHOOK_URL ||
    `http://127.0.0.1:${process.env.E2E_API_PORT || '3100'}${env.API_PREFIX}/payments/sepay/webhook`
  );
}

const sendWebhook = (body) =>
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}`,
    },
    body: JSON.stringify(body),
  }).then((r) => r.json());

test.beforeAll(async () => {
  webhookUrl = await resolveWebhookUrl();
  const actor = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  bankSettings = await prisma.systemSetting.findMany({
    where: { key: { in: [K.PAYMENT_BANK_CODE, K.PAYMENT_ACCOUNT_NUMBER] } },
  });
  await updateMany(
    [
      { key: K.PAYMENT_BANK_CODE, value: 'ACB' },
      { key: K.PAYMENT_ACCOUNT_NUMBER, value: '0000000000' },
    ],
    actor,
  );
  f = await createSprintFixture({ withApi: false });
  plan = await prisma.membershipPlan.create({
    data: {
      code: f.prefix,
      name: `E2E SePay ${f.prefix.slice(-6)}`,
      price: PRICE,
      durationDays: 30,
    },
  });
});
test.afterAll(async () => {
  const actor = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  if (bankSettings)
    await updateMany(
      bankSettings.map(({ key, value }) => ({ key, value })),
      actor,
    );
  await prisma.paymentWebhookLog.deleteMany({
    where: { invoice: { userId: { in: f.userIds } } },
  });
  await prisma.auditLog.deleteMany({
    where: { userId: null, entity: 'Invoice', createdAt: { gte: new Date(Date.now() - 3600000) } },
  });
  await cleanupSprintFixture(f);
  await prisma.membershipPlan.deleteMany({ where: { id: plan.id } });
  await prisma.$disconnect();
});

test('SEPAY-UI-01: hội viên mua online, thấy QR, webhook về thì tự chuyển Đã thanh toán', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Ảnh nghiệm thu chụp trên desktop');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, f.member, f.password);
  await page.goto('/membership-plans');
  const card = page.locator('.scms-plan-card').filter({ hasText: plan.name });
  await expect(card).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/1-bang-gia-goi-tap.png`, fullPage: true });

  await card.getByRole('button', { name: /Chọn gói này|Gia hạn/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tạo hóa đơn', exact: true }).click();
  const modal = page.locator('.ant-modal');
  await expect(modal.getByAltText('Mã QR chuyển khoản')).toBeVisible();
  await expect(modal.getByText('Chờ thanh toán')).toBeVisible();
  const invoice = await prisma.invoice.findFirstOrThrow({ where: { userId: f.member.id } });
  expect(invoice.channel).toBe('ONLINE');
  await expect(modal.getByText(invoice.code).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/2-hoa-don-online-ma-qr.png` });

  // SePay chuyển nhầm số tiền: hóa đơn phải giữ nguyên trạng thái chờ.
  const wrong = await sendWebhook({
    id: Date.now(),
    transferType: 'in',
    transferAmount: 1000,
    code: invoice.code,
    content: invoice.code,
  });
  expect(wrong.data.status).toBe('NEEDS_REVIEW');
  await expect(modal.getByText('Chờ thanh toán')).toBeVisible();

  const paid = await sendWebhook({
    id: Date.now() + 1,
    gateway: 'ACB',
    transferType: 'in',
    transferAmount: PRICE - 1000,
    code: invoice.code,
    content: invoice.code,
    referenceCode: 'E2E-NGHIEM-THU',
  });
  expect(paid.data.status).toBe('PROCESSED');
  await expect(modal.getByText(/Đã nhận thanh toán/)).toBeVisible({ timeout: 15000 });
  await expect(modal.getByText('Chuyển khoản (SePay)').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/3-tu-dong-chuyen-da-thanh-toan.png` });

  await page.keyboard.press('Escape');
  await page.goto('/payments');
  await expect(page.getByText(invoice.code).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/4-danh-sach-hoa-don-da-thanh-toan.png` });

  await page.goto('/membership-plans');
  await expect(page.getByText(plan.name).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/5-goi-hien-tai-sau-thanh-toan.png`, fullPage: true });
  expect(errors).toEqual([]);
});
