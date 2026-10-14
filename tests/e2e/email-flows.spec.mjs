import { createHash, randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { Enums, prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';

const SHOTS = 'outputs/email-nghiem-thu';
const PASSWORD = 'Flows@12345';
const NEW_PASSWORD = 'Moi@123456789';
const ZALO = 'https://zalo.me/trung-tam-demo';
const FACEBOOK = 'https://facebook.com/trung.tam.demo';
const stamp = Date.now();
const EMAIL = `e2e_mail_${stamp}@scms.test`;
const NEW_EMAIL = `e2e_mail_new_${stamp}@scms.test`;
const sha = (value) => createHash('sha256').update(value).digest('hex');
// Chờ hiệu ứng antd xong để ảnh nghiệm thu không bị chồng hình.
const settle = (page) => page.waitForTimeout(700);
const savedSettings = {};

/** Token cho link trong email: test tự tạo vì E2E không gửi và không đọc hộp thư. */
async function plantToken(userId, email, purpose) {
  const token = randomBytes(32).toString('hex');
  await prisma.emailVerificationToken.deleteMany({ where: { userId, purpose, usedAt: null } });
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      email,
      purpose,
      tokenHash: sha(token),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return token;
}

test.beforeAll(async () => {
  for (const [key, value] of [
    ['CENTER_SUPPORT_ZALO_URL', ZALO],
    ['CENTER_SUPPORT_FACEBOOK_URL', FACEBOOK],
  ]) {
    savedSettings[key] = (await prisma.systemSetting.findUniqueOrThrow({ where: { key } })).value;
    await prisma.systemSetting.update({ where: { key }, data: { value } });
  }
});
test.afterAll(async () => {
  for (const [key, value] of Object.entries(savedSettings)) {
    await prisma.systemSetting.update({ where: { key }, data: { value } });
  }
  const users = await prisma.user.findMany({
    where: { email: { in: [EMAIL, NEW_EMAIL] } },
    select: { id: true },
  });
  const ids = users.map((user) => user.id);
  await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

async function loginUi(page, identity, password) {
  await page.goto('/login');
  await page.getByLabel('Email hoặc số điện thoại', { exact: true }).fill(identity);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

test('EMAIL-UI-01: đăng ký → bị chặn đăng nhập → lễ tân xác minh hộ → quên mật khẩu → đổi email', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Chỉ nghiệm thu desktop');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // 1. Đăng ký: không đẩy về login mà hướng dẫn kiểm tra email + kênh hỗ trợ.
  await page.goto('/register');
  await page.getByLabel('Họ tên').fill('Hội Viên Email');
  await page.getByLabel('Email', { exact: true }).fill(EMAIL);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Nhập lại mật khẩu').fill(PASSWORD);
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await expect(page.getByText('Hãy kiểm tra email')).toBeVisible();
  await expect(page.getByRole('link', { name: /Zalo/ })).toHaveAttribute('href', ZALO);
  await expect(page.getByRole('link', { name: /Facebook/ })).toHaveAttribute('href', FACEBOOK);
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/1-dang-ky-cho-xac-minh-email.png` });

  // 2. Đăng nhập khi chưa xác minh: bị chặn kèm hướng dẫn.
  await loginUi(page, EMAIL, PASSWORD);
  await expect(page.getByText('Email chưa được xác minh', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gửi lại email xác minh' })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/2-dang-nhap-bi-chan-chua-xac-minh.png` });

  // 3. Lễ tân xác minh hộ khi hội viên không nhận được thư.
  await page.context().clearCookies();
  await loginUi(page, 'letan@scms.local', env.SEED_MOCK_PASSWORD);
  await expect(page.getByRole('button', { name: 'Mở menu tài khoản' })).toBeVisible();
  await page.goto('/members');
  const search = page.getByPlaceholder('Tìm theo tên, SĐT hoặc email');
  await search.fill(EMAIL);
  await search.press('Enter');
  await expect(page.getByText('Chưa xác minh email')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/3-le-tan-thay-hoi-vien-chua-xac-minh.png` });
  await page.getByRole('button', { name: 'Xem và sửa hồ sơ Hội Viên Email', exact: true }).click();
  await page.getByRole('button', { name: 'Xác minh email' }).click();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/4-le-tan-xac-nhan-xac-minh-thu-cong.png` });
  await page.locator('.ant-popconfirm').getByRole('button', { name: 'Xác minh' }).click();
  await expect(page.locator('.ant-drawer').getByText('Đã xác minh')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/5-hoi-vien-da-duoc-xac-minh.png` });
  const audit = await prisma.auditLog.findFirst({
    where: { entity: 'User', action: 'UPDATE' },
    orderBy: { id: 'desc' },
  });
  expect(audit.meta.manualEmailVerification).toBe(true);

  // 4. Quên mật khẩu → đặt lại bằng link → đăng nhập bằng mật khẩu mới.
  await page.evaluate(() => localStorage.clear());
  await page.goto('/forgot-password');
  await page.getByLabel('Email đã đăng ký').fill(EMAIL);
  await page.getByRole('button', { name: 'Gửi liên kết đặt lại mật khẩu' }).click();
  await expect(page.getByText('Đã gửi hướng dẫn')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/6-quen-mat-khau-da-gui-huong-dan.png` });
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  const resetToken = await plantToken(user.id, EMAIL, Enums.EmailTokenPurpose.RESET_PASSWORD);
  await page.goto(`/reset-password?token=${resetToken}`);
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Nhập lại mật khẩu mới').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Đặt mật khẩu mới' }).click();
  await expect(page.getByText('Đã đặt lại mật khẩu')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/7-dat-lai-mat-khau-thanh-cong.png` });
  await page.goto(`/reset-password?token=${resetToken}`);
  await page.getByLabel('Mật khẩu mới', { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel('Nhập lại mật khẩu mới').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: 'Đặt mật khẩu mới' }).click();
  await expect(page.getByText('Liên kết không hợp lệ hoặc đã hết hạn')).toBeVisible();

  // 5. Đăng nhập bằng mật khẩu mới rồi đổi email: email cũ giữ nguyên tới khi xác nhận.
  await loginUi(page, EMAIL, NEW_PASSWORD);
  await expect(page.getByRole('heading', { name: 'Lớp học và lịch tập' })).toBeVisible();
  await page.goto('/profile');
  const emailField = page.getByLabel('Email', { exact: true });
  await emailField.fill(NEW_EMAIL);
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByText(`Đang chờ xác nhận email mới: ${NEW_EMAIL}`)).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/8-doi-email-cho-xac-nhan.png` });
  expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(EMAIL);

  const changeToken = await plantToken(user.id, NEW_EMAIL, Enums.EmailTokenPurpose.CHANGE_EMAIL);
  await page.goto(`/verify-email?token=${changeToken}`);
  await expect(page.getByText('Đã xác nhận email mới')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/9-xac-nhan-email-moi-thanh-cong.png` });
  expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).email).toBe(NEW_EMAIL);
  expect(errors).toEqual([]);
});
