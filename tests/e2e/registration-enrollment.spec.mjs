import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import {
  createGopyFixture,
  cleanupGopyFixture,
  createPaidClass,
  buyCourseCash,
} from '../../core/be/tests/helpers/gopy.js';

test.setTimeout(90000);
let f;
let course;

test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Kiểm tra đăng ký tài khoản trên desktop');
  f = await createGopyFixture();
  course = await createPaidClass(f);
  await buyCourseCash(f, course.id, f.member.id);
});
test.afterEach(async () => cleanupGopyFixture(f));

test('TC-AUTH-ENROLL-E2E: tài khoản mới không tự đăng ký khi mở danh sách lớp', async ({
  page,
}, info) => {
  const bookingRequests = [];
  page.on('request', (request) => {
    if (
      request.method() === 'POST' &&
      /\/classes\/\d+\/(orders|enrollments|waitlist)/u.test(request.url())
    )
      bookingRequests.push(request.url());
  });
  const email = `${f.prefix}_new_browser@scms.test`;
  await page.goto('/register');
  await page.getByLabel('Họ tên', { exact: true }).fill('Học viên mới chưa chọn khóa');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(f.password);
  await page.getByLabel('Nhập lại mật khẩu', { exact: true }).fill(f.password);
  const response = page.waitForResponse((r) => r.url().endsWith('/auth/register'));
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  const registered = await response;
  expect(registered.status()).toBe(201);
  const user = (await registered.json()).data;
  f.userIds.push(user.id);
  await expect(
    page.getByText('Đăng ký thành công. Hãy kiểm tra email', { exact: true }),
  ).toBeVisible();
  expect(await prisma.classEnrollment.count({ where: { memberId: user.id } })).toBe(0);
  // Server E2E không gửi SMTP thật; chỉ xác minh tài khoản vừa tạo trong fixture.
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  await page.getByRole('button', { name: 'Đến trang đăng nhập' }).click();
  await page.getByLabel('Email hoặc số điện thoại', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(f.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Chào mừng trở lại, Học viên mới chưa chọn khóa' }),
  ).toBeVisible();
  await expect(
    page.locator('.ant-statistic').filter({ hasText: 'Khóa học đã đăng ký' }),
  ).toContainText('0');
  await page.getByRole('link', { name: 'Lớp học và lịch tập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lớp học và lịch tập' })).toBeVisible();
  const card = page
    .locator('.scms-class-card')
    .filter({ has: page.locator('h3', { hasText: course.name }) });
  await expect(card).toBeVisible();
  await expect(card.getByText('Sĩ số: 1 học viên', { exact: true })).toBeVisible();
  await expect(card.locator('.ant-tag').filter({ hasText: /^Đã đăng ký$/u })).toHaveCount(0);
  await expect(card.getByRole('button', { name: /Đăng ký khóa học/u })).toBeEnabled();
  await card.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('tab', { name: 'Lịch tập của tôi', exact: true }).click();
  await expect(
    page.getByText('Chưa có buổi học trong khoảng thời gian này', { exact: true }),
  ).toBeVisible();
  expect(bookingRequests).toEqual([]);
  expect(await prisma.classEnrollment.count({ where: { memberId: user.id } })).toBe(0);
  expect(await prisma.invoice.count({ where: { userId: user.id } })).toBe(0);
  await page.screenshot({
    path: info.outputPath('new-account-without-enrollment.png'),
    fullPage: true,
  });
});
