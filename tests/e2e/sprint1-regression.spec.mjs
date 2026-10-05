import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { ENTITIES } from '../../core/be/src/constants/index.js';
import { createSprintFixture, cleanupSprintFixture } from '../../core/be/tests/helpers/sprint1.js';
import { login } from './helpers/ui.mjs';

let f;
let admin;
let planId;
test.beforeAll(async () => {
  f = await createSprintFixture({ withApi: false });
  admin = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
});
test.afterAll(async () => {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entity: ENTITIES.USER, entityId: String(f.member.id) },
        ...(planId ? [{ entity: ENTITIES.MEMBERSHIP_PLAN, entityId: String(planId) }] : []),
      ],
    },
  });
  await cleanupSprintFixture(f);
  await prisma.$disconnect();
});

test('TC-UI-S1-01: hồi quy danh sách/sửa hội viên và form tạo gói', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, admin, env.SEED_ADMIN_PASSWORD);
  await page.goto('/members');
  const search = page.getByPlaceholder('Tên, số điện thoại hoặc email');
  await search.fill(f.member.email);
  await search.press('Enter');
  await page
    .getByRole('button', { name: `Xem và sửa hồ sơ ${f.member.fullName}`, exact: true })
    .click();
  await page
    .locator('.ant-drawer')
    .getByRole('button', { name: /Sửa hồ sơ$/ })
    .click();
  const name = `${f.member.fullName} Updated`;
  const phone = `0919${String(parseInt(f.prefix.slice(-6), 16) % 1000000).padStart(6, '0')}`;
  await page.getByLabel('Họ và tên', { exact: true }).fill(name);
  await page.getByLabel('Số điện thoại', { exact: true }).fill(phone);
  const updated = page.waitForResponse(
    (r) => r.url().endsWith(`/members/${f.member.id}`) && r.request().method() === 'PUT',
  );
  await page.locator('.ant-drawer').getByRole('button', { name: /Lưu$/ }).click();
  expect((await updated).status()).toBe(200);
  await expect(page.locator('.ant-drawer').getByText(name, { exact: true })).toBeVisible();
  await page.goto('/membership-plans');
  await page.getByRole('button', { name: /Thêm gói mới$/ }).click();
  await page.getByLabel('Mã gói', { exact: true }).fill(f.prefix.toUpperCase());
  await page.getByLabel('Tên gói', { exact: true }).fill(`${f.prefix} Regression Plan`);
  await page.getByLabel('Thời hạn (ngày)', { exact: true }).fill('30');
  await page.getByLabel('Giá tiền (VNĐ)', { exact: true }).fill('100000');
  await page
    .getByLabel('Quyền lợi (mỗi dòng một quyền lợi)', { exact: true })
    .fill('Tập luyện\nLớp nhóm');
  const created = page.waitForResponse(
    (r) => /\/membership-plans$/.test(r.url()) && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  planId = (await response.json()).data.id;
  await expect(
    page.getByRole('heading', { name: `${f.prefix} Regression Plan`, exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('sprint1.png'), fullPage: true });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
