import { PERMISSIONS as P } from '@scms/shared';
import { signAccessToken } from '../../core/be/src/common/utils/jwt.js';
import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import {
  createGopyFixture,
  cleanupGopyFixture,
  createPaidClass,
  buyCourseCash,
} from '../../core/be/tests/helpers/gopy.js';
let f;
let course;
let enrollment;
let operatorToken;
test.setTimeout(90000);
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Luồng liên hệ admin bằng mã hoàn trên desktop');
  f = await createGopyFixture();
  const role = await prisma.role.create({
    data: {
      code: `${f.prefix}_REFUND`,
      name: 'Nhân viên chỉ có quyền hoàn',
      permissions: { create: { permission: { connect: { code: P.PAYMENT_REFUND } } } },
    },
  });
  f.roleIds.push(role.id);
  const operator = await prisma.user.create({
    data: {
      email: `${f.prefix}_refund@scms.test`,
      fullName: 'Nhân viên xử lý hoàn',
      roleId: role.id,
      passwordHash: f.member.passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  f.userIds.push(operator.id);
  operatorToken = signAccessToken({ sub: operator.id, version: operator.tokenVersion });
  course = await createPaidClass(f, { price: 1000000 });
  enrollment = await buyCourseCash(f, course.id, f.member.id);
});
test.afterEach(async () => cleanupGopyFixture(f));
async function openAs(browser, token, path) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(
    (value) =>
      localStorage.setItem(
        'scms.auth',
        JSON.stringify({ state: { accessToken: value }, version: 0 }),
      ),
    token,
  );
  await page.goto(path);
  return { context, page };
}

test('TC-CANCEL-HISTORY-E2E: hội viên hủy, cung cấp mã hoàn cho admin, xem kết quả và thông báo', async ({
  browser,
}, info) => {
  const member = await openAs(browser, f.memberToken, '/schedule?tab=open');
  const errors = [];
  member.page.on('pageerror', (error) => errors.push(error.message));
  const card = member.page
    .locator('.scms-class-card')
    .filter({ has: member.page.locator('h3', { hasText: course.name }) });
  await card.getByRole('button', { name: 'Hủy khóa học', exact: true }).click();
  const cancellation = member.page.getByRole('dialog').filter({ hasText: 'Hủy khóa học' });
  await expect(cancellation.getByText('Ghi vào số dư', { exact: true })).toHaveCount(0);
  await cancellation
    .getByLabel('Lý do hủy', { exact: true })
    .fill('Liên hệ admin hoàn do đổi lịch làm việc');
  const response = member.page.waitForResponse(
    (r) =>
      r.request().method() === 'POST' && r.url().endsWith(`/enrollments/${enrollment.id}/cancel`),
  );
  await cancellation.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  const cancelled = await response;
  expect(cancelled.status()).toBe(200);
  const change = (await cancelled.json()).data;
  expect(change.refundCode).toMatch(/^HT\d+$/u);
  await member.page.goto('/profile');
  await member.page.getByRole('tab', { name: 'Lịch sử hủy khóa học', exact: true }).click();
  const row = member.page.getByRole('row').filter({ hasText: change.refundCode });
  await expect(row).toContainText('Chờ admin chuyển trả');
  await row.getByRole('button', { name: 'Chi tiết hủy', exact: true }).click();
  const detail = member.page.getByRole('dialog').filter({ hasText: 'Chi tiết hủy khóa học' });
  await expect(detail).toContainText('Liên hệ admin hoàn do đổi lịch làm việc');
  await expect(detail).toContainText(change.refundCode);
  await member.page.screenshot({
    path: info.outputPath('member-cancellation-code.png'),
    fullPage: true,
  });
  const admin = await openAs(browser, operatorToken, '/payments');
  admin.page.on('pageerror', (error) => errors.push(error.message));
  await admin.page.getByRole('tab', { name: 'Theo dõi hoàn tiền', exact: true }).click();
  await admin.page.getByLabel('Tìm mã hoàn tiền', { exact: true }).fill(change.refundCode);
  await admin.page.getByLabel('Tìm mã hoàn tiền', { exact: true }).press('Enter');
  const refundRow = admin.page.getByRole('row').filter({ hasText: change.refundCode });
  await expect(refundRow).toContainText(f.member.fullName);
  await refundRow.getByRole('button', { name: 'Xác nhận đã chuyển trả', exact: true }).click();
  const confirm = admin.page
    .getByRole('dialog')
    .filter({ hasText: `Xác nhận đã chuyển trả ${change.refundCode}` });
  await confirm
    .getByLabel('Mã tham chiếu ngân hàng', { exact: true })
    .fill('TEST-BANK-MANUAL-REFUND');
  const transferred = admin.page.waitForResponse((r) =>
    r.url().endsWith(`/refunds/${change.refundId}/complete`),
  );
  await confirm.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  expect((await transferred).status()).toBe(200);
  await expect(detail.getByText('Đã hoàn tiền', { exact: true })).toBeVisible();
  await expect(detail).toContainText('TEST-BANK-MANUAL-REFUND');
  await member.page.goto(`/payments?invoice=${enrollment.invoiceId}`);
  await expect(member.page.getByText('Đăng ký khóa học đã hủy', { exact: true })).toBeVisible();
  await expect(
    member.page.getByText('Đã nhận thanh toán. Khóa học đã có hiệu lực.', { exact: true }),
  ).toHaveCount(0);
  await member.page.goto('/notifications');
  await expect(
    member.page.getByText(`Đã hoàn tiền ${change.refundCode}`, { exact: true }),
  ).toBeVisible();
  expect((await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance).toBe(
    0,
  );
  expect(errors).toEqual([]);
  await admin.context.close();
  await member.context.close();
});
