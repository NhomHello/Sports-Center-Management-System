import { test, expect } from '@playwright/test';
import { prisma, Enums } from '../../core/be/src/config/db.js';
import { addCredit } from '../../core/be/src/modules/credit/credit.service.js';
import * as classService from '../../core/be/src/modules/class/class.service.js';
import {
  classPayload,
  createClassFixture,
  cleanupClassFixture,
} from '../../core/be/tests/helpers/sprint2.js';
import { card, login } from './helpers/ui.mjs';

// GY-36 (live): mua khóa học, giữ chỗ, dùng số dư, hủy khóa ghi số dư — API và DB thật.
const PRICE = 1200000;
let f;
let course;
let errors;
const money = (value) => `${value.toLocaleString('vi-VN')}`;

test.describe.configure({ mode: 'serial' });
test.beforeAll(async () => {
  f = await createClassFixture({ withApi: false });
  course = await classService.create(
    classPayload(f, { name: `${f.prefix} Khóa trả phí`, price: PRICE }),
    f.admin,
  );
  await prisma.$transaction((tx) =>
    addCredit(tx, {
      userId: f.member.id,
      amount: 2 * PRICE,
      reason: Enums.CreditReason.ADJUSTMENT,
      note: 'E2E nạp số dư',
      actorId: f.admin.id,
    }),
  );
});
test.afterAll(async () => {
  await prisma.creditTransaction.deleteMany({ where: { userId: { in: f.userIds } } });
  await prisma.purchaseChange.deleteMany({ where: { userId: { in: f.userIds } } });
  await cleanupClassFixture(f);
  await prisma.$disconnect();
});
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(async ({ page }, info) => {
  await page.screenshot({ path: info.outputPath('gopy.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('GY-22: hội viên đăng ký khóa học → giữ chỗ → mở hóa đơn khóa học', async ({ page }) => {
  await login(page, f.member, f.password);
  const source = card(page, course.name);
  await expect(source.getByText(`Học phí ${money(PRICE)}`)).toBeVisible();
  await source.getByRole('button', { name: /Đăng ký khóa học/ }).click();
  const created = page.waitForResponse(
    (r) => r.url().endsWith(`/classes/${course.id}/orders`) && r.request().method() === 'POST',
  );
  await page.locator('.ant-popconfirm').getByRole('button', { name: 'Đăng ký' }).click();
  expect((await created).status()).toBe(201);
  await expect(page).toHaveURL(/\/payments\?invoice=\d+/);
  const receipt = page.getByRole('dialog').filter({ hasText: 'Chi tiết hóa đơn' });
  await expect(receipt.getByText(`Khóa học ${course.name}`).first()).toBeVisible();
  const hold = await prisma.classEnrollment.findUniqueOrThrow({
    where: { classId_memberId: { classId: course.id, memberId: f.member.id } },
  });
  expect(hold.status).toBe('PENDING_PAYMENT');
});

test('GY-33: dùng số dư thanh toán hóa đơn khóa học → đăng ký chính thức', async ({ page }) => {
  const hold = await prisma.classEnrollment.findUniqueOrThrow({
    where: { classId_memberId: { classId: course.id, memberId: f.member.id } },
  });
  await login(page, f.member, f.password);
  await page.goto(`/payments?invoice=${hold.invoiceId}`);
  const receipt = page.getByRole('dialog').filter({ hasText: 'Chi tiết hóa đơn' });
  await receipt.getByRole('button', { name: /Dùng số dư/ }).click();
  const applied = page.waitForResponse((r) => r.url().endsWith('/apply-credit'));
  await page.getByRole('button', { name: 'Dùng số dư', exact: true }).click();
  expect((await applied).status()).toBe(200);
  await expect(page.getByText('Đã thanh toán bằng số dư')).toBeVisible();
  const booked = await prisma.classEnrollment.findUniqueOrThrow({ where: { id: hold.id } });
  expect(booked.status).toBe('BOOKED');
});

test('GY-34: hủy khóa trước ngày bắt đầu → hoàn 100% vào số dư', async ({ page }) => {
  await login(page, f.member, f.password);
  const source = card(page, course.name);
  await expect(source.getByText('Đã đăng ký', { exact: true })).toBeVisible();
  await source.getByRole('button', { name: 'Hủy khóa học' }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Hủy khóa học' });
  await expect(dialog.getByText('Được hoàn', { exact: true })).toBeVisible();
  await expect(dialog.getByText(`${money(PRICE)}`).first()).toBeVisible();
  await dialog.getByText('Ghi vào số dư').click();
  await dialog.getByLabel('Lý do hủy').fill('Đổi lịch làm việc');
  const cancelled = page.waitForResponse((r) => r.url().endsWith('/cancel'));
  await dialog.getByRole('button', { name: 'Xác nhận hủy' }).click();
  expect((await cancelled).status()).toBe(200);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } });
  expect(user.creditBalance).toBe(2 * PRICE);
});
