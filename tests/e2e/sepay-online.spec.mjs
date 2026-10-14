import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { createSprintFixture, cleanupSprintFixture } from '../../core/be/tests/helpers/sprint1.js';
import { login } from './helpers/ui.mjs';

const SHOTS = 'outputs/sepay-nghiem-thu';
const NGROK_API = 'http://127.0.0.1:4040/api/tunnels';
const PRICE = 450000;
let f;
let plan;
let webhookUrl;

/** Webhook đi qua ngrok công khai như SePay thật, không gọi thẳng BE test. */
async function resolveWebhookUrl() {
  const res = await fetch(NGROK_API);
  const { tunnels } = await res.json();
  return `${tunnels[0].public_url}${env.API_PREFIX}/payments/sepay/webhook`;
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

  await card.getByRole('button', { name: 'Chọn gói này' }).click();
  const modal = page.locator('.ant-modal');
  await expect(modal.getByAltText('Mã QR chuyển khoản')).toBeVisible();
  await expect(modal.getByText('Chờ thanh toán')).toBeVisible();
  const invoice = await prisma.invoice.findFirstOrThrow({ where: { userId: f.member.id } });
  expect(invoice.channel).toBe('ONLINE');
  await expect(modal.getByText(invoice.code).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/2-hoa-don-online-ma-qr.png` });

  // SePay chuyển nhầm số tiền: hoá đơn phải giữ nguyên trạng thái chờ.
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
    transferAmount: PRICE,
    code: invoice.code,
    content: invoice.code,
    referenceCode: 'E2E-NGHIEM-THU',
  });
  expect(paid.data.status).toBe('PROCESSED');
  await expect(modal.getByText('Đã nhận thanh toán')).toBeVisible({ timeout: 15000 });
  await expect(modal.getByText('Chuyển khoản (SePay)')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/3-tu-dong-chuyen-da-thanh-toan.png` });

  await page.keyboard.press('Escape');
  await page.goto('/payments');
  await expect(page.getByText(invoice.code)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/4-danh-sach-hoa-don-da-thanh-toan.png` });

  await page.goto('/membership-plans');
  await expect(page.getByText(plan.name).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/5-goi-hien-tai-sau-thanh-toan.png`, fullPage: true });
  expect(errors).toEqual([]);
});
