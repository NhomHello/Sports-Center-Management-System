import { test, expect } from '@playwright/test';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { createCourseFixture, cleanupCourseFixture } from '../../core/be/tests/helpers/sprint4.js';
import { classPayload } from '../../core/be/tests/helpers/sprint2.js';
test.setTimeout(120000);
let f; let future; let sepayId;
const base = `http://127.0.0.1:${process.env.E2E_FE_PORT || '5180'}`;
const apiRoot = `http://127.0.0.1:${process.env.E2E_API_PORT || '3100'}${env.API_PREFIX}`;
const tokenHeader = (token) => ({ Authorization: `Bearer ${token}` });
async function openAs(browser, token, path) {
  const context = await browser.newContext({ baseURL: base, viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript((value) => localStorage.setItem('scms.auth', JSON.stringify({ state: { accessToken: value }, version: 0 })), token);
  await page.goto(path); return { page, context };
}
test.beforeEach(async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'Nghiệm thu chức năng tại desktop');
  f = await createCourseFixture();
  const permission = await prisma.permission.findUniqueOrThrow({ where: { code: P.ATTENDANCE_RECORD } });
  await prisma.rolePermission.createMany({ skipDuplicates: true, data: [{ roleId: f.coach.roleId, permissionId: permission.id }] });
  const response = await request.post(`${apiRoot}/classes`, { headers: tokenHeader(f.adminToken), data: classPayload(f, { name: `${f.prefix} Khóa SePay`, description: 'Khóa học nâng cao sức bền, chú trọng kỹ thuật an toàn.', price: 600000, capacity: 1 }) });
  expect(response.status()).toBe(201); future = (await response.json()).data;
});
test.afterEach(async () => {
  if (!f) return;
  if (sepayId) {
    await prisma.reconciliationCase.deleteMany({ where: { webhookLog: { providerTransactionId: sepayId } } });
    await prisma.paymentWebhookLog.deleteMany({ where: { providerTransactionId: sepayId } });
  }
  await cleanupCourseFixture(f); f = null;
});
test('TC-COURSE-ONLY-E2E: bán khóa học, SePay và ghi chú cá nhân theo buổi', async ({ browser, request }, info) => {
  const member = await openAs(browser, f.memberToken, '/schedule');
  const errors = []; const retiredRequests = [];
  member.page.on('pageerror', (e) => errors.push(e.message));
  member.page.on('request', (r) => { if (/\/api\/v1\/(memberships|membership-plans)(\/|\?|$)/u.test(r.url())) retiredRequests.push(r.url()); });
  await expect(member.page.getByRole('heading', { name: 'Lớp học và lịch tập' })).toBeVisible();
  await expect(member.page.getByRole('link', { name: 'Gói tập', exact: true })).toHaveCount(0);
  const courseCard = member.page.locator('.scms-class-card').filter({ has: member.page.locator('h3', { hasText: future.name }) });
  await expect(courseCard).toBeVisible();
  await courseCard.getByRole('button', { name: /Đăng ký khóa học/ }).click();
  const created = member.page.waitForResponse((r) => r.url().includes(`/classes/${future.id}/orders`) && r.request().method() === 'POST');
  await member.page.locator('.ant-popconfirm:visible').getByRole('button', { name: 'Đăng ký', exact: true }).click();
  const purchase = await created; expect(purchase.status()).toBe(201); const invoice = (await purchase.json()).data;
  expect(invoice.kind).toBe('COURSE'); expect(invoice.amount).toBe(600000);
  await expect(member.page.getByRole('dialog')).toBeVisible();
  if (invoice.paymentInstruction) await expect(member.page.getByAltText('Mã QR chuyển khoản')).toBeVisible();
  sepayId = `course-e2e-${Date.now()}`;
  const paid = await request.post(`${apiRoot}/payments/sepay/webhook`, { headers: { Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` }, data: { id: sepayId, gateway: 'ACB', transferType: 'in', transferAmount: invoice.amount, code: invoice.code, content: invoice.code } });
  expect(paid.status()).toBe(200); expect((await paid.json()).data.outcome).toBe('PAID');
  await expect(member.page.getByText('Đã nhận thanh toán. Khóa học đã có hiệu lực.', { exact: true })).toBeVisible();
  await member.page.screenshot({ path: info.outputPath('course-sepay-paid.png'), fullPage: true });

  const teacher = await openAs(browser, f.coachToken, '/schedule?tab=assigned');
  teacher.page.on('pageerror', (e) => errors.push(e.message));
  const pastCard = teacher.page.locator('.scms-class-card').filter({ has: teacher.page.locator('h3', { hasText: f.item.name }) });
  await expect(pastCard).toBeVisible(); await pastCard.getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await teacher.page.getByRole('button', { name: 'Nội dung buổi', exact: true }).first().click();
  await teacher.page.getByLabel('Mô tả nội dung, mục tiêu và chuẩn bị cho buổi học').fill('Luyện nhịp thở và động tác kiểm soát tư thế.');
  await teacher.page.getByRole('button', { name: 'Lưu nội dung', exact: true }).click();
  await expect(teacher.page.getByText('Luyện nhịp thở và động tác kiểm soát tư thế.')).toBeVisible();
  await teacher.page.getByRole('button', { name: 'Điểm danh', exact: true }).first().click();
  const attendance = teacher.page.getByRole('dialog').filter({ has: teacher.page.getByText('Nhận xét từng học viên', { exact: true }) });
  await expect(attendance).toBeVisible();
  await attendance.getByRole('row').filter({ hasText: f.member.fullName }).getByRole('button', { name: 'Nhận xét', exact: true }).click();
  const note = 'Tiến bộ rõ ở tư thế; cần giữ nhịp thở đều trong buổi sau.';
  await teacher.page.getByLabel('Nhận xét và lưu ý cho học viên').fill(note);
  await teacher.page.getByRole('button', { name: 'Lưu nhận xét', exact: true }).click();
  await expect(teacher.page.getByText(note, { exact: true })).toBeVisible();
  await teacher.page.screenshot({ path: info.outputPath('teacher-session-feedback.png'), fullPage: true });
  const feedback = await request.get(`${apiRoot}/attendance/feedback/me`, { headers: tokenHeader(f.memberToken) });
  expect(feedback.status()).toBe(200); expect((await feedback.json()).data.some((row) => row.note === note)).toBe(true);
  await member.page.goto('/attendance');
  await expect(member.page.getByText(note, { exact: true })).toBeVisible();
  await member.page.screenshot({ path: info.outputPath('member-own-feedback.png'), fullPage: true });
  expect(errors).toEqual([]); expect(retiredRequests).toEqual([]);
  await teacher.context.close(); await member.context.close();
});
