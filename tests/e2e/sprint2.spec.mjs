import { test, expect } from '@playwright/test';
import { card, login, chooseDate, confirmBooking, selectTab } from './helpers/ui.mjs';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { hashPassword } from '../../core/be/src/common/utils/password.js';
import {
  classPayload,
  createClassFixture,
  cleanupClassFixture,
} from '../../core/be/tests/helpers/sprint2.js';
import * as classService from '../../core/be/src/modules/class/class.service.js';
import * as enrollmentService from '../../core/be/src/modules/class/class-enrollment.service.js';

let f;
let primary;
let teaching;
let unassigned;
let staff;
let pageErrors;
test.beforeAll(async () => {
  f = await createClassFixture({ withApi: false });
  primary = await classService.create(classPayload(f, { name: `${f.prefix} Booking` }), f.admin);
  teaching = await classService.create(
    classPayload(f, {
      name: `${f.prefix} Teaching`,
      weeklySchedule: [{ ...primary.weeklySchedule[0], startTime: '20:00', endTime: '21:00' }],
    }),
    f.admin,
  );
  unassigned = await classService.create(
    classPayload(f, {
      name: `${f.prefix} Unassigned`,
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
    }),
    f.admin,
  );
  await enrollmentService.enroll(teaching.id, f.other.id, f.admin);
  const role = await prisma.role.create({
    data: {
      code: `${f.prefix}_STAFF`,
      name: `${f.prefix} Staff`,
      permissions: {
        create: [P.CLASS_READ, P.CLASS_ENROLL_FOR_MEMBER, P.MEMBER_READ].map((code) => ({
          permission: { connect: { code } },
        })),
      },
    },
  });
  f.roleIds.push(role.id);
  staff = await prisma.user.create({
    data: {
      email: `${f.prefix}_staff@scms.test`,
      fullName: `${f.prefix} Staff`,
      roleId: role.id,
      passwordHash: await hashPassword(f.password),
    },
  });
  f.userIds.push(staff.id);
  f.extraSubjectIds = [];
});
test.afterAll(async () => {
  for (const id of f?.extraSubjectIds || []) {
    await prisma.auditLog.deleteMany({ where: { entity: 'subject', entityId: String(id) } });
    await prisma.subject.delete({ where: { id } });
  }
  await cleanupClassFixture(f);
  await prisma.$disconnect();
});
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
});
test.afterEach(async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('schedule.png'), fullPage: true });
  expect(pageErrors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('TC-F2-U01: hội viên đăng ký, xem lịch và huỷ từ lịch cá nhân', async ({ page }) => {
  await login(page, f.member, f.password);
  const source = card(page, primary.name);
  await expect(source).toBeVisible();
  await confirmBooking(page, source, {
    button: 'Đăng ký lớp',
    confirmation: 'Đăng ký',
    method: 'POST',
  });
  await expect(source.getByRole('button', { name: 'Huỷ đăng ký', exact: true })).toBeVisible();
  await selectTab(page, 'Lịch tập của tôi');
  await chooseDate(page, primary.sessions[0].startAt.toISOString().slice(0, 10));
  await expect(page.getByText(primary.name, { exact: true })).toBeVisible();
  await confirmBooking(page, page.locator('.scms-week-grid'), {
    button: 'Huỷ đăng ký',
    confirmation: 'Huỷ đăng ký',
    method: 'DELETE',
  });
  await page.getByRole('switch').click();
  await expect(page.getByText(primary.name, { exact: true })).toBeVisible();
});

test('TC-F2-U02: lễ tân tìm hội viên rồi đăng ký và huỷ hộ có audit', async ({ page }) => {
  await login(page, staff, f.password);
  const search = page.getByPlaceholder('Email hoặc số điện thoại hội viên');
  await search.fill(f.member.email);
  await search.press('Enter');
  await page.locator('.scms-member-select').click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(`${f.member.fullName} · ${f.member.email}`, { exact: true })
    .click();
  const source = card(page, primary.name).last();
  await expect(source.getByRole('button', { name: 'Đăng ký hộ', exact: true })).toBeEnabled();
  await confirmBooking(page, source, {
    button: 'Đăng ký hộ',
    confirmation: 'Đăng ký',
    method: 'POST',
  });
  const enrolled = card(page, primary.name).first();
  await expect(enrolled.getByRole('button', { name: 'Huỷ hộ', exact: true })).toBeVisible();
  await confirmBooking(page, enrolled, {
    button: 'Huỷ hộ',
    confirmation: 'Huỷ đăng ký',
    method: 'DELETE',
  });
  await expect(enrolled.getByRole('button', { name: 'Đăng ký hộ', exact: true })).toBeEnabled();
  await expect(source.getByText('Còn 2/2 chỗ', { exact: true })).toBeVisible();
  const row = await prisma.classEnrollment.findUnique({
    where: {
      classId_memberId: {
        classId: primary.id,
        memberId: f.member.id,
      },
    },
  });
  expect(row.enrolledBy).toBe(staff.id);
  expect(row.cancelledBy).toBe(staff.id);
  await expect(page.getByRole('button', { name: 'Tạo lớp', exact: true })).toHaveCount(0);
});

test('TC-F2-U03: HLV xem lịch dạy và roster; không xem lớp của HLV khác', async ({
  page,
  request,
}) => {
  await login(page, f.coach, f.password);
  await chooseDate(page, teaching.sessions[0].startAt.toISOString().slice(0, 10));
  const source = page
    .locator('.ant-card')
    .filter({ has: page.getByText(teaching.name, { exact: true }) });
  await source.getByRole('button', { name: 'Danh sách học viên', exact: true }).click();
  await expect(page.getByRole('dialog').getByText(f.other.fullName, { exact: true })).toBeVisible();
  const api = `http://localhost:${env.PORT}${env.API_PREFIX}`;
  const auth = await request.post(`${api}/auth/login`, {
    data: { email: f.coach.email, password: f.password },
  });
  const token = (await auth.json()).data.accessToken;
  const response = await request.get(`${api}/classes/${unassigned.id}/roster`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(403);
  await expect(page.getByText(unassigned.name, { exact: true })).toHaveCount(0);
});

test('TC-F2-U04: quản lý lọc lớp, sửa cấu hình, xem chi tiết và quản lý bộ môn', async ({
  page,
}) => {
  await login(page, f.admin, env.SEED_ADMIN_PASSWORD);
  const search = page.getByPlaceholder('Tìm tên lớp');
  await search.fill(primary.name);
  await search.press('Enter');
  await expect(card(page, primary.name)).toBeVisible();
  await card(page, primary.name).getByRole('button', { name: 'Sửa lớp', exact: true }).click();
  await page.getByLabel('Tên lớp', { exact: true }).fill(`${primary.name} Updated`);
  const saved = page.waitForResponse(
    (r) => r.url().endsWith(`/classes/${primary.id}`) && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: 'Lưu lớp', exact: true }).click();
  expect((await saved).status()).toBe(200);
  primary.name += ' Updated';
  await card(page, primary.name).getByRole('button', { name: 'Chi tiết', exact: true }).click();
  await expect(page.getByText('Các buổi học', { exact: true })).toBeVisible();
  await page.locator('.ant-drawer-close').click();
  await selectTab(page, 'Bộ môn');
  await page.getByRole('button', { name: 'Thêm mới', exact: true }).click();
  const name = `${f.prefix} UI Subject`;
  await page.getByLabel('Tên', { exact: true }).fill(name);
  const created = page.waitForResponse(
    (r) => r.url().endsWith('/subjects') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  expect((await created).status()).toBe(201);
  const row = await prisma.subject.findUniqueOrThrow({ where: { name } });
  f.extraSubjectIds.push(row.id);
  await expect(card(page, name)).toBeVisible();
});
