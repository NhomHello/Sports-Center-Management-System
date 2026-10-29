import { test, expect } from '@playwright/test';
import { prisma, Enums } from '../../core/be/src/config/db.js';
import { createSprintFixture, cleanupSprintFixture } from '../../core/be/tests/helpers/sprint1.js';
import { login } from './helpers/ui.mjs';

let f;
test.beforeAll(async () => {
  f = await createSprintFixture({ withApi: false });
  await prisma.notification.createMany({
    data: ['Một', 'Hai', 'Ba'].map((title) => ({
      userId: f.member.id,
      kind: Enums.NotificationKind.CLASS_CHANGED,
      title: `Thông báo kiểm thử ${title}`,
      message: `${f.prefix} Nội dung lịch học đã thay đổi.`,
    })),
  });
});
test.afterAll(async () => {
  await cleanupSprintFixture(f);
  await prisma.$disconnect();
});

test('Thông báo: đọc từ chuông, chọn nhiều và cập nhật trạng thái trên trang', async ({ page }) => {
  const errors = [];
  const warnings = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/deprecated|disabled.*empty.*value/.test(message.text())) warnings.push(message.text());
  });
  await login(page, f.member, f.password);
  await page.getByRole('button', { name: 'Thông báo', exact: true }).click();
  const panel = page.locator('.scms-notification-panel');
  const first = panel
    .locator('.scms-notification-item')
    .filter({ hasText: 'Thông báo kiểm thử Một' });
  await first.getByRole('button', { name: 'Đánh dấu đã đọc', exact: true }).click();
  await expect(first.getByText('Đã đọc', { exact: true })).toBeVisible();
  await panel.getByRole('link', { name: 'Xem tất cả thông báo' }).click();
  await expect(page.getByRole('heading', { name: 'Thông báo', exact: true })).toBeVisible();
  for (const title of ['Hai', 'Ba'])
    await page
      .getByRole('checkbox', { name: `Chọn thông báo: Thông báo kiểm thử ${title}`, exact: true })
      .check();
  await page.getByRole('button', { name: 'Đánh dấu đã đọc (2)', exact: true }).click();
  await expect(page.getByText('Chưa đọc: 0', { exact: true })).toBeVisible();
  expect(await prisma.notification.count({ where: { userId: f.member.id, readAt: null } })).toBe(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});
