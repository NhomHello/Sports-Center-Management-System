import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { createCancellationHistoryFixture } from '../../core/be/tests/helpers/cancellation-history.js';
import { cleanupGopyFixture } from '../../core/be/tests/helpers/gopy.js';
let f;
let item;
const ownNote = 'Nhận xét phải được giữ sau hủy';
const privateNote = 'Nhận xét riêng của học viên khác, không hiển thị cho chủ tài khoản';
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Xem khóa học và từng buổi trên desktop');
  ({ f, item } = await createCancellationHistoryFixture());
  await prisma.sessionFeedback.create({
    data: {
      sessionId: item.sessions[0].id,
      memberId: f.other.id,
      authorId: f.coach.id,
      rating: 2,
      note: privateNote,
    },
  });
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

test('TC-COURSE-HISTORY-E2E: chọn khóa để xem đủ 20 buổi, ghép điểm danh/nhận xét và chỉ đọc đúng hội viên', async ({
  browser,
}, info) => {
  const owner = await openAs(browser, f.memberToken, '/schedule?tab=open');
  const errors = [];
  owner.page.on('pageerror', (e) => errors.push(e.message));
  const booking = owner.page
    .locator('.scms-class-card')
    .filter({ has: owner.page.locator('h3', { hasText: item.name }) });
  await expect(booking.getByRole('button', { name: 'Đã đăng ký', exact: true })).toBeDisabled();
  await owner.page.goto('/attendance');
  await expect(
    owner.page.getByRole('heading', { name: 'Điểm danh và nhận xét theo khóa học' }),
  ).toBeVisible();
  const card = owner.page
    .locator('.ant-card')
    .filter({ has: owner.page.getByText(item.name, { exact: true }) });
  await card.getByRole('button', { name: 'Xem các buổi học', exact: true }).click();
  const table = owner.page.locator('.scms-course-session-history');
  await expect(table.getByRole('row')).toHaveCount(21);
  await expect(table.getByText('Buổi 1', { exact: true })).toBeVisible();
  await expect(table.getByText('Buổi 20', { exact: true })).toBeVisible();
  await expect(table.getByRole('row').filter({ hasText: ownNote })).toContainText('Có mặt');
  await expect(table.getByText('Chưa có nhận xét', { exact: true })).toHaveCount(19);
  await expect(owner.page.getByText(privateNote, { exact: true })).toHaveCount(0);
  await owner.page.screenshot({
    path: info.outputPath('member-course-sessions.png'),
    fullPage: true,
  });

  const admin = await openAs(browser, f.adminToken, '/members');
  admin.page.on('pageerror', (e) => errors.push(e.message));
  await admin.page.getByLabel('Tìm hội viên', { exact: true }).fill(f.member.email);
  await admin.page.getByLabel('Tìm hội viên', { exact: true }).press('Enter');
  const memberRow = admin.page.getByRole('row').filter({ hasText: f.member.email });
  await memberRow.getByRole('button', { name: `Xem và sửa hồ sơ ${f.member.fullName}`, exact: true }).click();
  const drawer = admin.page.getByRole('dialog').filter({ hasText: 'Chi tiết hội viên' });
  await drawer.getByRole('tab', { name: 'Buổi học & nhận xét', exact: true }).click();
  await drawer.getByRole('button', { name: 'Xem các buổi học', exact: true }).click();
  const staffTable = drawer.locator('.scms-course-session-history');
  await expect(staffTable.getByRole('row')).toHaveCount(21);
  await expect(staffTable.getByText(ownNote, { exact: true })).toBeVisible();
  await expect(staffTable.getByText(privateNote, { exact: true })).toHaveCount(0);
  await admin.page.screenshot({
    path: info.outputPath('admin-member-course-sessions.png'),
    fullPage: true,
  });
  expect(errors).toEqual([]);
  await admin.context.close();
  await owner.context.close();
});
