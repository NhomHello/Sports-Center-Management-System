import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import {
  classPayload,
  createClassFixture,
  cleanupClassFixture,
} from '../../core/be/tests/helpers/sprint2.js';
import * as classService from '../../core/be/src/modules/class/class.service.js';
import * as enrollmentService from '../../core/be/src/modules/class/class-enrollment.service.js';
import {
  card,
  login,
  chooseDate,
  confirmBooking,
  calendarActions,
  closeCalendarActions,
  selectTab,
} from './helpers/ui.mjs';

test.use({ timezoneId: 'Pacific/Auckland' });
const DAY_MS = 86400000;
const api = `http://127.0.0.1:${env.PORT}${env.API_PREFIX}`;
let f;
let monday;
let own;
let teaching;
let lastSeat;
let errors;
async function apiHeaders(request, user, password) {
  const response = await request.post(`${api}/auth/login`, {
    data: { email: user.email, password },
  });
  expect(response.status()).toBe(200);
  return { Authorization: `Bearer ${(await response.json()).data.accessToken}` };
}
const scheduleResponse = (response, path) => {
  const url = new URL(response.url());
  return url.pathname.endsWith(path) && url.searchParams.get('weekStart') === monday;
};
const calendarCard = (page, item) =>
  page.locator('.ant-card').filter({ has: page.getByText(item.name, { exact: true }) });

test.beforeAll(async () => {
  f = await createClassFixture({ withApi: false });
  const future = new Date(Date.now() + 14 * DAY_MS);
  future.setUTCDate(future.getUTCDate() + ((1 - future.getUTCDay() + 7) % 7));
  monday = future.toISOString().slice(0, 10);
  const create = (name, startTime, endTime, extra = {}) =>
    classService.create(
      classPayload(f, {
        name: `${f.prefix} ${name}`,
        startsOn: monday,
        weeklySchedule: [{ dayOfWeek: 1, startTime, endTime }],
        ...extra,
      }),
      f.admin,
    );
  own = await create('Own calendar', '17:00', '18:00');
  teaching = await create('Teaching calendar', '18:00', '19:00');
  lastSeat = await create('Last seat', '20:00', '21:00', {
    capacity: 1,
    coachId: f.coachOther.id,
    roomId: f.roomOther.id,
  });
  await enrollmentService.enroll(own.id, f.member.id, f.admin);
  await enrollmentService.enroll(teaching.id, f.member.id, f.admin);
});
test.afterAll(async () => {
  await cleanupClassFixture(f);
  await prisma.$disconnect();
});
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await page.screenshot({ path: info.outputPath('schedule.png'), fullPage: true });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('TC-F2-X01: chỗ cuối bị người khác giữ, UI tải lại điều kiện sau lỗi đăng ký', async ({
  page,
  request,
}) => {
  await login(page, f.member, f.password);
  const search = page.getByPlaceholder('Tìm tên lớp');
  await search.fill(lastSeat.name);
  await search.press('Enter');
  const source = card(page, lastSeat.name);
  await expect(source.getByText('Còn 1/1 chỗ', { exact: true })).toBeVisible();
  const headers = await apiHeaders(request, f.other, f.password);
  const taken = await request.post(`${api}/classes/${lastSeat.id}/enrollments/me`, { headers });
  expect(taken.status()).toBe(201);
  const rejected = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/classes/${lastSeat.id}/enrollments/me`) &&
      response.request().method() === 'POST',
  );
  await source.getByRole('button', { name: 'Đăng ký lớp', exact: true }).click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Đăng ký', exact: true })
    .click();
  expect((await rejected).status()).toBe(422);
  await expect(source.getByText('Còn 0/1 chỗ', { exact: true })).toBeVisible();
  await expect(source.getByRole('button', { name: 'Đăng ký lớp', exact: true })).toBeDisabled();
  expect(await prisma.classEnrollment.count({ where: { classId: lastSeat.id } })).toBe(1);
});

test('TC-F2-X02: chọn đúng tuần Việt Nam ngoài múi giờ VN; gói hết hạn vẫn giữ lịch đã có', async ({
  page,
}) => {
  await prisma.membership.updateMany({
    where: { userId: f.member.id },
    data: { endDate: new Date(Date.now() - DAY_MS) },
  });
  await login(page, f.member, f.password);
  await selectTab(page, 'Lịch tập của tôi');
  const response = page.waitForResponse((r) => scheduleResponse(r, '/schedule/me'));
  await chooseDate(page, monday);
  expect((await response).status()).toBe(200);
  await expect(page.getByText(own.name, { exact: true })).toBeVisible();
  await page.getByText('Ngày', { exact: true }).click();
  await expect(page.locator('.scms-day-grid').getByText(own.name, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(page.getByText(own.name, { exact: true })).toHaveCount(0);
  await expect(page.locator('.scms-calendar-total')).toHaveText('0 buổi học');
  await page.getByRole('button', { name: 'Trước', exact: true }).click();
  await confirmBooking(page, calendarCard(page, own), {
    button: 'Huỷ đăng ký',
    confirmation: 'Huỷ đăng ký',
    method: 'DELETE',
  });
  await page.getByRole('switch').click();
  await expect(calendarCard(page, own).getByText('Đã huỷ', { exact: true })).toBeVisible();
});

test('TC-F2-X03: lịch dạy tự cập nhật khi quản lý huỷ lớp; hội viên nhận thông báo và giữ roster', async ({
  page,
  browser,
  request,
}) => {
  test.setTimeout(90000);
  await login(page, f.coach, f.password);
  const first = page.waitForResponse((r) => scheduleResponse(r, '/schedule/teaching'));
  await chooseDate(page, monday);
  expect((await first).status()).toBe(200);
  await expect(page.getByText(teaching.name, { exact: true })).toBeVisible();
  const memberPage = await browser.newPage({
    viewport: page.viewportSize(),
    timezoneId: 'Pacific/Auckland',
  });
  try {
    await login(memberPage, f.member, f.password);
    await page.bringToFront();
    const headers = await apiHeaders(request, f.admin, env.SEED_ADMIN_PASSWORD);
    const refreshed = page.waitForResponse((r) => scheduleResponse(r, '/schedule/teaching'), {
      timeout: 40000,
    });
    const cancelled = await request.delete(`${api}/classes/${teaching.id}`, { headers });
    expect(cancelled.status()).toBe(200);
    expect((await refreshed).status()).toBe(200);
    await expect(page.getByText(teaching.name, { exact: true })).toHaveCount(0);
    await page.getByRole('switch').click();
    const source = calendarCard(page, teaching).first();
    await expect(source.getByText('Đã huỷ', { exact: true })).toBeVisible();
    const actions = await calendarActions(page, source, 'Danh sách học viên');
    await actions.getByRole('button', { name: 'Danh sách học viên', exact: true }).click();
    await expect(
      page.getByRole('dialog').getByText(f.member.fullName, { exact: true }),
    ).toBeVisible();
    await page.locator('.ant-modal .ant-modal-close').click();
    await expect(page.locator('.ant-modal')).toHaveCount(0);
    await closeCalendarActions(page);
    await memberPage.getByRole('button', { name: 'Thông báo', exact: true }).click();
    await expect(
      memberPage.getByText(`Lớp ${teaching.name} đã bị huỷ.`, { exact: true }),
    ).toBeVisible();
    expect(
      await memberPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true);
  } finally {
    await memberPage.context().close();
  }
});
