import { test, expect } from '@playwright/test';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import {
  classPayload,
  createClassFixture,
  cleanupClassFixture,
} from '../../core/be/tests/helpers/sprint2.js';
import * as classService from '../../core/be/src/modules/class/class.service.js';
import { WEEKDAYS } from '../../core/fe/src/constants/schedule.js';
import { card, login, selectOption, selectTab } from './helpers/ui.mjs';

let f;
let item;
let errors;
const wallTime = (value) =>
  new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
async function setPicker(page, label, value) {
  const input = page.getByLabel(label, { exact: true });
  await input.fill(value);
  await input.press('Enter');
  await input.press('Tab');
}

test.beforeAll(async () => {
  f = await createClassFixture({ withApi: false });
  item = await classService.create(classPayload(f), f.admin);
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
  if (info.status !== info.expectedStatus) {
    const invalid = page.locator('.ant-form-item-has-error');
    if (await invalid.count()) {
      process.stdout.write(`${JSON.stringify(await invalid.allTextContents())}\n`);
      await invalid.first().scrollIntoViewIfNeeded();
    }
  }
  await page.screenshot({ path: info.outputPath('schedule.png'), fullPage: true });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('TC-F2-V01: quản lý tạo và hủy toàn lớp từ form; sửa và ngừng phòng tập', async ({ page }) => {
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Tạo lớp', exact: true }).click();
  const data = classPayload(f, {
    name: `${f.prefix} UI Created`,
    weeklySchedule: [{ ...item.weeklySchedule[0], startTime: '21:00', endTime: '22:00' }],
  });
  await page.getByLabel('Tên lớp', { exact: true }).fill(data.name);
  await selectOption(page, 'Bộ môn', f.subject.name);
  await selectOption(
    page,
    'Phòng tập',
    `${f.room.name} · ${f.roomType.name} · tối đa ${f.room.capacity} người`,
  );
  await selectOption(page, 'Huấn luyện viên', f.coach.fullName);
  await page.getByLabel('Sức chứa', { exact: true }).fill(String(data.capacity));
  await setPicker(page, 'Ngày bắt đầu', data.startsOn);
  await setPicker(page, 'Ngày kết thúc', data.endsOn);
  await setPicker(page, 'Mở đăng ký lúc', wallTime(data.registrationStartAt));
  await setPicker(page, 'Đóng đăng ký lúc', wallTime(data.registrationEndAt));
  await selectOption(
    page,
    'Thứ',
    WEEKDAYS.find((d) => d.value === data.weeklySchedule[0].dayOfWeek).label,
  );
  const frame = await prisma.operatingFrame.findFirstOrThrow({
    where: { isActive: true, startTime: { lte: '21:00' }, endTime: { gte: '22:00' } },
  });
  await page.getByLabel('Khung giờ hoạt động', { exact: true }).click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(`${frame.name} (${frame.startTime}–${frame.endTime})`, { exact: true })
    .click();
  const times = page.getByRole('dialog').locator('.ant-picker-range input');
  await times.nth(0).fill('21:00');
  await times.nth(0).press('Tab');
  await times.nth(1).fill('22:00');
  await times.nth(1).press('Tab');
  const created = page.waitForResponse(
    (r) => /\/classes$/.test(r.url()) && r.request().method() === 'POST',
    { timeout: 15000 },
  );
  await page.getByRole('button', { name: 'Lưu lớp', exact: true }).click();
  expect((await created).status()).toBe(201);
  const source = card(page, data.name);
  await expect(source).toBeVisible();
  await source.getByRole('button', { name: 'Thao tác quản lý lớp' }).click();
  await page.getByRole('menuitem', { name: 'Hủy lớp', exact: true }).click();
  const cancelled = page.waitForResponse(
    (r) => /\/classes\/\d+$/.test(r.url()) && r.request().method() === 'DELETE',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Hủy lớp', exact: true }).click();
  expect((await cancelled).status()).toBe(200);
  await expect(source.getByText('Đã hủy', { exact: true })).toBeVisible();
  await selectTab(page, 'Phòng tập');
  const room = card(page, f.roomOther.name);
  await room.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByLabel('Sức chứa', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(room.getByText('Sức chứa: 12', { exact: true })).toBeVisible();
  await room.getByRole('button', { name: 'Ngừng hoạt động', exact: true }).click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: 'Đồng ý', exact: true })
    .click();
  await expect(room.getByText('Ngừng hoạt động', { exact: true })).toBeVisible();
});

test('TC-F2-V02: lịch HLV có trạng thái rỗng, đang tải, lỗi và thử lại', async ({ page }) => {
  await login(page, f.coach, f.password);
  await expect(
    page.getByText('Chưa có buổi học trong khoảng thời gian này', { exact: true }),
  ).toBeVisible();
  let release;
  await page.route('**/schedule/teaching?*', async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.getByRole('button', { name: 'Trước', exact: true }).click();
  try {
    await expect(page.getByLabel('Đang tải lịch', { exact: true })).toBeVisible();
  } finally {
    release?.();
  }
  await expect(
    page.getByText('Chưa có buổi học trong khoảng thời gian này', { exact: true }),
  ).toBeVisible();
  await page.unroute('**/schedule/teaching?*');
  await page.route('**/schedule/teaching?*', (route) =>
    route.fulfill({
      status: 503,
      json: { success: false, message: 'Lịch đang bảo trì', code: 'TEST_ERROR' },
    }),
  );
  await page.getByRole('button', { name: 'Trước', exact: true }).click();
  await expect(page.getByText('Lịch đang bảo trì', { exact: true })).toBeVisible();
  await page.unroute('**/schedule/teaching?*');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(
    page.getByText('Chưa có buổi học trong khoảng thời gian này', { exact: true }),
  ).toBeVisible();
});

// Góp ý GV: khóa học tách khỏi gói tự tập, gói hết hạn vẫn đăng ký được lớp miễn phí.
test('TC-F2-V03: gói tự tập hết hạn không chặn đăng ký lớp miễn phí', async ({ page }) => {
  await prisma.membership.updateMany({
    where: { userId: f.member.id },
    data: { endDate: new Date() },
  });
  await login(page, f.member, f.password);
  const source = card(page, item.name);
  await expect(source.getByText('Học phí: Miễn phí', { exact: true })).toBeVisible();
  await expect(source.getByRole('button', { name: 'Đăng ký lớp', exact: true })).toBeEnabled();
  await expect(source.getByText('Cần gói tập còn hiệu lực để đăng ký lớp')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tạo lớp', exact: true })).toHaveCount(0);
});
