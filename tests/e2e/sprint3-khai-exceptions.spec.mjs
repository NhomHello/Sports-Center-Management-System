import { test, expect } from '@playwright/test';
import { SETTING_KEYS as K } from '@scms/shared';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { getValue } from '../../core/be/src/modules/setting/setting.service.js';
import { vietnamDate } from '../../core/be/src/common/utils/vietnam-date.js';
import { login, selectTab } from './helpers/ui.mjs';
import { fixture, cleanup, call, searchClass } from './helpers/khai.mjs';

let f;
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop');
  f = await fixture({ freeze: info.title.includes('TC-S3-K03') });
});
test.afterEach(async () => {
  await cleanup(f);
  f = undefined;
});
const capture = (page, info) =>
  page.screenshot({ path: info.outputPath('screen.png'), fullPage: true });

test('TC-S3-K01: login locks after configured failed attempts', async ({ page }, info) => {
  const limit = await getValue(K.LOGIN_MAX_FAILED_ATTEMPTS);
  for (let i = 1; i < limit; i++)
    await call(f, 'post', '/auth/login', { email: f.member.email, password: 'Wrong@Test123' });
  await page.goto('/login');
  await page.getByLabel('Email hoặc số điện thoại', { exact: true }).fill(f.member.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Wrong@Test123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText(/Đã thử đăng nhập sai nhiều lần/).first()).toBeVisible();
  await capture(page, info);
});

test('TC-S3-K02: duplicate counter registration opens the existing profile', async ({
  page,
}, info) => {
  await prisma.user.update({ where: { id: f.member.id }, data: { phone: '0901234567' } });
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  await page.goto('/members');
  await page.getByRole('button', { name: /Thêm hội viên/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Họ và tên', { exact: true }).fill('Test duplicate');
  await dialog.getByLabel('Email', { exact: true }).fill(f.member.email);
  await dialog.getByLabel('Số điện thoại', { exact: true }).fill('0901234567');
  await dialog.getByLabel('Mật khẩu tạm thời', { exact: true }).fill(f.password);
  await dialog.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(dialog.getByText('*******567')).toBeVisible();
  await dialog.getByRole('button', { name: 'Mở hồ sơ này' }).click();
  await expect(page.locator('.ant-drawer')).toContainText(f.member.fullName);
  await capture(page, info);
});

test('TC-S3-K03: member freezes and resumes a membership', async ({ page }, info) => {
  await login(page, f.member, f.password);
  await page.goto('/membership-plans');
  const inputs = page.locator('.ant-picker-range input');
  await inputs.nth(0).fill(vietnamDate().split('-').reverse().join('/'));
  await inputs.nth(1).fill(
    vietnamDate(new Date(Date.now() + 7 * 86400000))
      .split('-')
      .reverse()
      .join('/'),
  );
  await inputs.nth(1).press('Tab');
  await page.getByRole('button', { name: 'Yêu cầu bảo lưu' }).click();
  await expect(page.getByRole('button', { name: 'Kết thúc bảo lưu' })).toBeVisible();
  await capture(page, info);
  await page.getByRole('button', { name: 'Kết thúc bảo lưu' }).click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Kết thúc bảo lưu', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Yêu cầu bảo lưu' })).toBeVisible();
});

test('TC-S3-K04: waitlist offer requires explicit enrollment', async ({ page }, info) => {
  expect(
    (await call(f, 'post', `/classes/${f.item.id}/enrollments/me`, {}, f.memberToken)).status,
  ).toBe(201);
  await login(page, f.other, f.password);
  const card = await searchClass(page, f);
  await card.getByRole('button', { name: 'Vào danh sách chờ' }).click();
  await expect(card.getByText('Sẽ thông báo khi có chỗ trống.', { exact: true })).toBeVisible();
  await call(f, 'delete', `/classes/${f.item.id}/enrollments/me`, {}, f.memberToken);
  await page.reload();
  await searchClass(page, f);
  await expect(card.getByText(/Giữ đến/)).toBeVisible();
  await capture(page, info);
  await card.getByRole('button', { name: 'Xác nhận đăng ký', exact: true }).click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Đăng ký', exact: true })
    .click();
  await expect(card.getByText('Đã đăng ký', { exact: true })).toBeVisible();
});

test('TC-S3-K05: manager changes coach and keeps session history', async ({ page }, info) => {
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  const card = await searchClass(page, f);
  await card.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await page.getByRole('button', { name: 'Đổi HLV phụ trách', exact: true }).click();
  await page.getByLabel('HLV thay thế', { exact: true }).click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(f.coachOther.fullName, { exact: true })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đổi HLV', exact: true }).click();
  await expect(
    page.locator('.ant-drawer').getByText(f.coachOther.fullName, { exact: true }),
  ).toBeVisible();
  await capture(page, info);
});

test('TC-S3-K06: room maintenance is visible in the resource catalog', async ({ page }, info) => {
  await prisma.roomMaintenance.create({
    data: {
      roomId: f.room.id,
      actorId: f.admin.id,
      reason: 'TEST maintenance',
      startAt: new Date(Date.now() - 3600000),
      endAt: new Date(Date.now() + 3600000),
    },
  });
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  await selectTab(page, 'Phòng tập');
  await page.getByPlaceholder('Tìm tên danh mục').fill(f.room.name);
  await page.getByPlaceholder('Tìm tên danh mục').press('Enter');
  const card = page
    .locator('.ant-card')
    .filter({ has: page.getByText(f.room.name, { exact: true }) });
  await expect(card.locator('.ant-tag').filter({ hasText: 'Bảo trì' })).toBeVisible();
  await capture(page, info);
});

test('TC-S3-K07: no-show block explains when booking becomes available', async ({ page }, info) => {
  await prisma.user.update({
    where: { id: f.member.id },
    data: { bookingBlockedUntil: new Date(Date.now() + 86400000) },
  });
  await login(page, f.member, f.password);
  const card = await searchClass(page, f);
  await expect(card.getByText(/Tạm chặn do vắng nhiều buổi/)).toBeVisible();
  await expect(card.getByRole('button', { name: 'Đăng ký lớp', exact: true })).toBeDisabled();
  await capture(page, info);
});
