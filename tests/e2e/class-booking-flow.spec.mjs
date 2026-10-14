import { test, expect } from '@playwright/test';
import { card, confirmBooking, login, selectTab } from './helpers/ui.mjs';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import * as classService from '../../core/be/src/modules/class/class.service.js';
import {
  classPayload,
  cleanupClassFixture,
  createClassFixture,
} from '../../core/be/tests/helpers/sprint2.js';

const SHOTS = 'outputs/xep-lop-nghiem-thu';
const DAYS_PER_WEEK = 7;
const RECEPTIONIST = { email: 'letan@scms.local' };
// Chờ hiệu ứng antd xong để ảnh nghiệm thu không bị chồng hình.
const settle = (page) => page.waitForTimeout(700);
let f;
let classA;
let classB;

test.beforeAll(async () => {
  f = await createClassFixture({ withApi: false });
  const base = classPayload(f, { name: `${f.prefix} Lớp A` });
  const [first] = base.weeklySchedule;
  // Lớp A học hai buổi/tuần cùng khung giờ để thẻ lớp hiển thị lịch được gộp.
  classA = await classService.create(
    {
      ...base,
      weeklySchedule: [first, { ...first, dayOfWeek: (first.dayOfWeek + 2) % DAYS_PER_WEEK }],
    },
    f.admin,
  );
  // Lớp B khác phòng/HLV nhưng chồng giờ với lớp A: chỉ còn xung đột của hội viên.
  classB = await classService.create(
    classPayload(f, {
      name: `${f.prefix} Lớp B trùng giờ`,
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
      weeklySchedule: [{ ...first, startTime: '18:30', endTime: '19:30' }],
    }),
    f.admin,
  );
});
test.afterAll(async () => {
  await cleanupClassFixture(f);
  await prisma.$disconnect();
});

test('XEPLOP-UI-01: quản lý xem lớp, hội viên đăng ký, chặn trùng giờ, lễ tân đăng ký hộ', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Chỉ nghiệm thu desktop');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // 1. Quản lý: thẻ lớp có lịch học đầy đủ, không có nút đăng ký cho chính mình.
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  const managed = card(page, classA.name);
  await expect(managed).toBeVisible();
  await expect(managed.getByText(/18:00–19:00/)).toBeVisible();
  await expect(managed.getByRole('button', { name: 'Đăng ký lớp', exact: true })).toHaveCount(0);
  await expect(managed.getByRole('button', { name: 'Danh sách học viên' })).toBeVisible();
  await managed.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/1-quan-ly-the-lop-co-lich-hoc.png` });
  await page.evaluate(() => localStorage.clear());

  // 2-3. Hội viên: xem lịch, đăng ký toàn lớp, thấy hạn huỷ.
  await login(page, f.member, f.password);
  const mine = card(page, classA.name);
  await expect(mine.getByText(/Thứ .*, Thứ .* · 18:00–19:00/)).toBeVisible();
  await expect(mine.getByText('Còn 2/2 chỗ')).toBeVisible();
  await mine.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/2-hoi-vien-xem-lop-va-lich-hoc.png` });
  await confirmBooking(page, mine, {
    button: 'Đăng ký lớp',
    confirmation: 'Đăng ký',
    method: 'POST',
  });
  await expect(mine.getByRole('button', { name: 'Huỷ đăng ký', exact: true })).toBeVisible();
  await expect(mine.getByText(/Hạn huỷ lớp:/)).toBeVisible();
  await expect(mine.getByText('Còn 1/2 chỗ')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/3-hoi-vien-da-dang-ky-co-han-huy.png` });

  // 4. Lớp B chồng giờ: nút bị khoá kèm lý do rõ ràng từ server.
  const clash = card(page, classB.name);
  await expect(clash.getByText('Trùng lịch với lớp đã đăng ký')).toBeVisible();
  await expect(clash.getByRole('button', { name: 'Đăng ký lớp', exact: true })).toBeDisabled();
  await clash.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/4-chan-trung-gio-co-ly-do.png` });
  await page.evaluate(() => localStorage.clear());

  // 5-6. Lễ tân đăng ký hộ cho hội viên khác; hệ thống ghi nhận người thực hiện.
  await login(page, RECEPTIONIST, env.SEED_MOCK_PASSWORD);
  await selectTab(page, 'Đăng ký / huỷ hộ');
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/5-le-tan-man-dang-ky-ho.png` });
  const search = page.getByPlaceholder('Email hoặc số điện thoại hội viên');
  await search.fill(f.other.email);
  await search.press('Enter');
  await page.locator('.scms-member-select').click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(`${f.other.fullName} · ${f.other.email}`, { exact: true })
    .click();
  const forMember = card(page, classA.name).last();
  await expect(forMember.getByRole('button', { name: 'Đăng ký hộ', exact: true })).toBeEnabled();
  await confirmBooking(page, forMember, {
    button: 'Đăng ký hộ',
    confirmation: 'Đăng ký',
    method: 'POST',
  });
  await expect(
    card(page, classA.name).first().getByRole('button', { name: 'Huỷ hộ' }),
  ).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/6-le-tan-da-dang-ky-ho.png` });

  const staff = await prisma.user.findUniqueOrThrow({ where: { email: RECEPTIONIST.email } });
  const row = await prisma.classEnrollment.findUniqueOrThrow({
    where: { classId_memberId: { classId: classA.id, memberId: f.other.id } },
  });
  expect(row.enrolledBy).toBe(staff.id);
  expect(errors).toEqual([]);
});
