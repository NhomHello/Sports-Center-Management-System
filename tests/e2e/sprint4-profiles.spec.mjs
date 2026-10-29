import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import {
  createProfileFixture,
  cleanupProfileFixture,
} from '../../core/be/tests/helpers/profiles.js';
import { login } from './helpers/ui.mjs';
let f;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jw5sAAAAASUVORK5CYII=',
  'base64',
);
const snap = async (page, info, name) => {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.screenshot({
    path: info.outputPath(`${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
};
test.beforeAll(async () => {
  f = await createProfileFixture();
});
test.afterAll(async () => {
  await cleanupProfileFixture(f);
});

async function trainingProfile(page) {
  await page.goto('/profile');
  await page.getByRole('tab', { name: 'Hồ sơ tập luyện', exact: true }).click();
  await expect(page.getByLabel('Mục tiêu tập luyện', { exact: true })).toBeVisible();
}
async function saveTraining(page) {
  const saved = page.waitForResponse(
    (r) => r.url().endsWith('/me/member-profile') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Lưu hồ sơ tập luyện', exact: true }).click();
  expect((await saved).status()).toBe(200);
}

test('S4-01/02: HLV sửa hồ sơ và ảnh, liên hệ công khai không đổi email đăng nhập', async ({
  page,
}, info) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, f.coach, f.password);
  await page.goto('/profile');
  await expect(page.getByRole('tab', { name: 'Hồ sơ HLV', exact: true })).toBeVisible();
  await page
    .getByLabel('Giới thiệu', { exact: true })
    .fill('Huấn luyện sức bền, hỗ trợ người mới bắt đầu.');
  const uploaded = page.waitForResponse(
    (r) => r.url().endsWith('/me/coach-profile/avatar') && r.request().method() === 'PUT',
  );
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });
  expect((await uploaded).status()).toBe(200);
  await expect(page.getByLabel('Giới thiệu', { exact: true })).toHaveValue(
    'Huấn luyện sức bền, hỗ trợ người mới bắt đầu.',
  );
  await page.getByLabel('Email liên hệ công khai', { exact: true }).fill('coach-public@scms.test');
  await page
    .getByRole('switch', { name: 'Hiện thông tin liên hệ cho hội viên', exact: true })
    .check();
  const saved = page.waitForResponse(
    (r) => r.url().endsWith('/me/coach-profile') && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Lưu hồ sơ HLV', exact: true }).click();
  expect((await saved).status()).toBe(200);
  expect((await prisma.user.findUniqueOrThrow({ where: { id: f.coach.id } })).email).toBe(
    f.coach.email,
  );
  await snap(page, info, 'coach-own-profile');
  expect(errors).toEqual([]);
});

test('S4-03..06: hội viên tìm HLV, mở hồ sơ và đi đến đúng lớp', async ({ page }, info) => {
  await login(page, f.member, f.password);
  await page.goto('/coaches');
  await page.getByPlaceholder('Tìm theo tên HLV').fill(f.coach.fullName);
  await page.getByPlaceholder('Tìm theo tên HLV').press('Enter');
  await page.getByRole('link', { name: f.coach.fullName, exact: true }).click();
  await expect(page.getByRole('heading', { name: f.coach.fullName, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gửi email', exact: true })).toHaveAttribute(
    'href',
    'mailto:coach-public@scms.test',
  );
  await snap(page, info, 'coach-public-profile');
  await page.getByRole('link', { name: new RegExp(f.item.name) }).click();
  await expect(
    page.locator('.ant-drawer').getByText('Các buổi học', { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.ant-drawer').getByRole('link', { name: f.coach.fullName, exact: true }),
  ).toBeVisible();
});

test('S4-07..10: chia sẻ hồ sơ, chuyên cần và 403 ngoài phạm vi', async ({ page }, info) => {
  await login(page, f.member, f.password);
  await trainingProfile(page);
  await page.getByLabel('Mục tiêu tập luyện', { exact: true }).fill('Tăng sức bền trong 3 tháng');
  await page
    .getByLabel('Ghi chú sức khoẻ / chấn thương', { exact: true })
    .fill('Đau đầu gối, cần tránh bật nhảy');
  await page
    .getByRole('switch', { name: 'Chia sẻ mục tiêu và sức khoẻ với HLV', exact: true })
    .uncheck();
  await saveTraining(page);
  await snap(page, info, 'member-training-profile');
  await page.evaluate(() => localStorage.clear());
  await login(page, f.coach, f.password);
  await page.goto('/coach/members');
  const row = page.getByRole('row').filter({ hasText: f.member.fullName });
  await row.getByRole('button', { name: 'Xem hồ sơ học viên' }).click();
  const drawer = page.locator('.ant-drawer');
  await expect(
    drawer.getByText('Hội viên chưa chia sẻ mục tiêu và sức khoẻ với HLV.'),
  ).toBeVisible();
  await expect(drawer.getByText('Đau đầu gối, cần tránh bật nhảy')).toHaveCount(0);
  await snap(page, info, 'student-private');
  await page.evaluate(() => localStorage.clear());
  await login(page, f.member, f.password);
  await trainingProfile(page);
  await page
    .getByRole('switch', { name: 'Chia sẻ mục tiêu và sức khoẻ với HLV', exact: true })
    .check();
  await saveTraining(page);
  await page.evaluate(() => localStorage.clear());
  await login(page, f.coach, f.password);
  await page.goto('/coach/members');
  await page.getByRole('button', { name: 'Xem hồ sơ học viên' }).click();
  await expect(
    page.locator('.ant-drawer').getByText('Đau đầu gối, cần tránh bật nhảy'),
  ).toBeVisible();
  await snap(page, info, 'student-shared');
  const response = await f.call('get', `/coach/members/${f.other.id}`, undefined, f.coachToken);
  expect(response.status).toBe(403);
  const denied = await f.call('get', `/coach/members/${f.member.id}`, undefined, f.coachOtherToken);
  expect(denied.status).toBe(403);
});

test('S4-08: nhân viên sửa hộ hồ sơ tại chi tiết hội viên và ghi audit', async ({ page }, info) => {
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  await page.goto('/members');
  await page.getByPlaceholder('Tìm theo tên, SĐT hoặc email').fill(f.member.email);
  await page.getByPlaceholder('Tìm theo tên, SĐT hoặc email').press('Enter');
  await page
    .getByRole('row')
    .filter({ hasText: f.member.fullName })
    .getByRole('button', { name: `Xem và sửa hồ sơ ${f.member.fullName}`, exact: true })
    .click();
  const drawer = page.locator('.ant-drawer');
  await drawer.getByRole('tab', { name: 'Hồ sơ tập luyện' }).click();
  await drawer.getByLabel('Mục tiêu tập luyện', { exact: true }).fill('Mục tiêu cập nhật tại quầy');
  const saved = page.waitForResponse(
    (r) => r.url().endsWith(`/members/${f.member.id}/profile`) && r.request().method() === 'PUT',
  );
  await drawer.getByRole('button', { name: 'Lưu hồ sơ tập luyện' }).click();
  expect((await saved).status()).toBe(200);
  const audit = await prisma.auditLog.findFirstOrThrow({
    where: { userId: f.admin.id, entity: 'memberProfile', entityId: String(f.member.id) },
  });
  expect(audit.meta.fields).toContain('goals');
  await snap(page, info, 'staff-member-profile');
});
