import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { api, apiPath, bearer } from '../../core/be/tests/helpers/api.js';
import {
  createClassFixture,
  cleanupClassFixture,
  classPayload,
} from '../../core/be/tests/helpers/sprint2.js';
import { login, card, chooseDate } from './helpers/ui.mjs';
let f;
let item;
test.beforeAll(async () => {
  f = await createClassFixture();
  const res = await api.post(apiPath('/classes')).set(bearer(f.adminToken)).send(classPayload(f));
  expect(res.status).toBe(201);
  item = res.body.data;
  expect(
    (await api.post(apiPath(`/classes/${item.id}/enrollments/me`)).set(bearer(f.memberToken)))
      .status,
  ).toBe(201);
});
test.afterAll(async () => {
  if (!f) return;
  await prisma.attendance.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.roomMaintenance.deleteMany({
    where: { roomId: { in: [f.room.id, f.roomOther.id] } },
  });
  await cleanupClassFixture(f);
});
const admin = (page) => login(page, f.admin, env.SEED_ADMIN_PASSWORD);
const dialog = (page, title) => page.locator('.ant-modal').filter({ hasText: title });
async function detail(page) {
  await page.goto('/schedule?tab=manage');
  await page.getByPlaceholder('Tìm tên lớp').fill(item.name);
  await page.getByPlaceholder('Tìm tên lớp').press('Enter');
  await card(page, item.name).getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByText('Các buổi học', { exact: true })).toBeVisible();
}

test('S3-11/13/83: đổi HLV, đổi giờ và huỷ một buổi, giữ lịch sử', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Thao tác bảng ở desktop');
  await admin(page);
  await detail(page);
  await page.getByRole('button', { name: 'Đổi HLV phụ trách', exact: true }).click();
  const coach = dialog(page, 'Đổi HLV phụ trách');
  await coach.getByLabel('HLV thay thế').click();
  await page.getByTitle(f.coachOther.fullName, { exact: true }).click();
  await coach.getByRole('button', { name: 'Đổi HLV', exact: true }).click();
  await expect(coach).not.toBeVisible();
  await page.getByRole('button', { name: 'Đổi giờ', exact: true }).first().click();
  const change = dialog(page, 'Đổi giờ một buổi');
  const inputs = change.locator('.ant-picker input');
  const nextStart = new Date(new Date(item.sessions[0].startAt).getTime() + 3600000);
  const nextEnd = new Date(new Date(item.sessions[0].endAt).getTime() + 3600000);
  const fmt = (d) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(d)
      .replace(',', '');
  await inputs.nth(0).fill(fmt(nextStart));
  await inputs.nth(0).press('Enter');
  await inputs.nth(1).fill(fmt(nextEnd));
  await inputs.nth(1).press('Enter');
  await change.getByRole('button', { name: 'Lưu giờ mới' }).click();
  await expect(change).not.toBeVisible();
  expect(
    (
      await prisma.classSession.findUniqueOrThrow({ where: { id: item.sessions[0].id } })
    ).startAt.toISOString(),
  ).toBe(nextStart.toISOString());
  await page.getByRole('button', { name: 'Huỷ buổi', exact: true }).first().click();
  const cancel = dialog(page, 'Huỷ buổi học');
  await expect(cancel.getByText('Sẽ thông báo 1 hội viên đang đăng ký.')).toBeVisible();
  await cancel.getByLabel('Lý do huỷ').fill('HLV bận đột xuất');
  await cancel.getByRole('button', { name: 'Huỷ buổi', exact: true }).click();
  await expect(cancel).not.toBeVisible();
  expect(
    (await prisma.classSession.findUniqueOrThrow({ where: { id: item.sessions[0].id } })).status,
  ).toBe('CANCELLED');
});

test('S3-49/51: điểm danh và lịch sử chính chủ; hội viên không truy cập báo cáo', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Thao tác điểm danh ở desktop');
  const session = await prisma.classSession.create({
    data: {
      classId: item.id,
      coachId: f.coach.id,
      roomId: f.room.id,
      startAt: new Date(Date.now() - 7200000),
      endAt: new Date(Date.now() - 3600000),
    },
  });
  await prisma.classEnrollment.updateMany({
    where: { classId: item.id, memberId: f.member.id },
    data: { enrolledAt: new Date(Date.now() - 86400000) },
  });
  await admin(page);
  await detail(page);
  const row = page.locator('.ant-drawer tbody tr').filter({ hasText: 'Đã hoàn thành' }).first();
  await row.getByRole('button', { name: 'Điểm danh' }).click();
  const attendance = dialog(page, 'Điểm danh buổi học');
  await attendance.getByRole('combobox', { name: `Điểm danh ${f.member.fullName}` }).click();
  await page.getByTitle('Có mặt', { exact: true }).click();
  await attendance.getByRole('button', { name: 'Lưu điểm danh' }).click();
  await expect(attendance).not.toBeVisible();
  expect(
    (
      await prisma.attendance.findUniqueOrThrow({
        where: { sessionId_memberId: { sessionId: session.id, memberId: f.member.id } },
      })
    ).status,
  ).toBe('PRESENT');
  await page.evaluate(() => localStorage.clear());
  await login(page, f.member, f.password);
  await page.goto('/attendance');
  await expect(page.getByRole('cell', { name: item.name, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Có mặt', exact: true })).toBeVisible();
  await page.goto('/reports');
  await expect(page.getByText('Bạn không có quyền', { exact: false })).toBeVisible();
});

test('UI-F1: tổng quan, menu gọn và cấu hình dùng Tabs ở desktop/mobile', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await admin(page);
  await page.goto('/');
  await expect(page.getByText('Hội viên hoạt động', { exact: true })).toBeVisible();
  await expect(page.getByText('Phiếu đối soát đang mở', { exact: true })).toBeVisible();
  await page.goto('/system/settings');
  await expect(page.getByRole('tab', { name: 'Tài khoản', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Tài khoản', exact: true }).click();
  await expect(page.getByLabel('Số lần đăng nhập sai tối đa')).toBeVisible();
  await page.goto('/reset-password?token=invalid');
  await expect(
    page.getByText('Liên kết không hợp lệ hoặc đã hết hạn', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Mật khẩu mới', { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('UI-F2-02: gợi ý hội viên khi gõ và tách tab đăng ký hộ', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Bộ chọn tab desktop');
  await admin(page);
  await page.goto('/schedule?tab=staff');
  const search = page.getByRole('combobox', { name: 'Chọn hội viên' });
  await search.fill(f.member.fullName);
  await page.getByTitle(new RegExp(f.member.fullName)).click();
  await expect(page.getByRole('tab', { name: 'Đã đăng ký', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Đăng ký lớp mới', exact: true })).toBeVisible();
});

test('S3-85: xem buổi bảo trì, chọn phòng và áp dụng', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Bảng kế hoạch bảo trì desktop');
  await admin(page);
  await page.goto('/schedule?tab=rooms');
  await page.getByPlaceholder('Tìm tên danh mục').fill(f.room.name);
  await page.getByPlaceholder('Tìm tên danh mục').press('Enter');
  await card(page, f.room.name).getByRole('button', { name: 'Bảo trì' }).click();
  const maintenance = dialog(page, 'Bảo trì ·');
  const inputs = maintenance.locator('.ant-picker input');
  const s = item.sessions[1];
  const format = (iso) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(new Date(iso))
      .replace(',', '');
  await inputs.nth(0).fill(format(s.startAt));
  await inputs.nth(0).press('Enter');
  await inputs.nth(1).fill(format(s.endAt));
  await inputs.nth(1).press('Enter');
  await maintenance.getByLabel('Lý do', { exact: true }).fill('Bảo trì máy lạnh');
  await maintenance.getByRole('button', { name: 'Xem buổi bị ảnh hưởng' }).click();
  await maintenance.getByRole('combobox').click();
  await page.getByTitle(new RegExp(f.roomOther.name)).click();
  await maintenance.getByRole('button', { name: 'Áp dụng kế hoạch' }).click();
  await expect(maintenance).not.toBeVisible();
  expect((await prisma.classSession.findUniqueOrThrow({ where: { id: s.id } })).roomId).toBe(
    f.roomOther.id,
  );
});

test('UI-F2: lịch tuần 7 cột, lọc phòng và chuyển từ lịch trống sang lớp mở', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Kiểm tra lưới tuần 1366px');
  await admin(page);
  await page.goto('/schedule?tab=week');
  await expect(page.getByRole('tab', { name: 'Lịch dạy', exact: true })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Phòng', exact: true }).click();
  const request = page.waitForResponse(
    (r) =>
      r.url().includes('/schedule/week') &&
      new URL(r.url()).searchParams.get('roomId') === String(f.room.id),
  );
  await page
    .locator('.ant-select-dropdown:visible')
    .getByTitle(f.room.name, { exact: true })
    .click();
  expect((await request).status()).toBe(200);
  await chooseDate(page, item.sessions[0].startAt.slice(0, 10));
  await page.getByRole('switch', { name: 'Hiện lịch đã huỷ' }).check();
  await expect(page.locator('.scms-week-grid')).toBeVisible();
  expect(
    await page
      .locator('.scms-week-grid')
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
  ).toBe(7);
  await page.evaluate(() => localStorage.clear());
  await login(page, f.member, f.password);
  await page.goto('/schedule?tab=own');
  await chooseDate(page, '2026-01-05');
  await expect(page.getByText('Chưa có buổi học trong khoảng thời gian này')).toBeVisible();
  await page.getByRole('button', { name: 'Xem lớp đang mở', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Lớp đang mở', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
