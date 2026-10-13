import { test, expect } from '@playwright/test';
import { Enums, prisma } from '../../core/be/src/config/db.js';
import { env } from '../../core/be/src/config/env.js';
import { TIME } from '../../core/be/src/constants/index.js';
import { createSprintFixture, cleanupSprintFixture } from '../../core/be/tests/helpers/sprint1.js';
import { login } from './helpers/ui.mjs';

const SHOTS = 'outputs/quay-nghiem-thu';
const RECEPTIONIST = { email: 'letan@scms.local' };
let f;
let plan;

// Chờ hiệu ứng mở/đóng modal của antd xong để ảnh nghiệm thu không bị chồng hình.
const settle = (page) => page.waitForTimeout(700);

test.beforeAll(async () => {
  f = await createSprintFixture({ withApi: false });
  plan = await prisma.membershipPlan.create({
    data: {
      code: f.prefix,
      name: `E2E Quầy ${f.prefix.slice(-6)}`,
      price: 300000,
      durationDays: 30,
    },
  });
  // Hội viên còn hạn 10 ngày: thu tiền phải cộng dồn vào gói hiện tại.
  await prisma.membership.create({
    data: {
      userId: f.member.id,
      activeUserId: f.member.id,
      planId: plan.id,
      status: Enums.MembershipStatus.ACTIVE,
      startDate: new Date(Date.now() - 20 * TIME.MS_PER_DAY),
      endDate: new Date(Date.now() + 10 * TIME.MS_PER_DAY),
    },
  });
});
test.afterAll(async () => {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        {
          entity: 'Invoice',
          userId: { not: null },
          createdAt: { gte: new Date(Date.now() - 3600000) },
          meta: { path: '$.memberId', equals: f.member.id },
        },
      ],
    },
  });
  await cleanupSprintFixture(f);
  await prisma.membershipPlan.deleteMany({ where: { id: plan.id } });
  await prisma.$disconnect();
});

test('QUAY-UI-01: lễ tân tạo hóa đơn quầy, thấy tác động gia hạn, thu tiền mặt, in biên lai', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Chỉ nghiệm thu desktop');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page, RECEPTIONIST, env.SEED_MOCK_PASSWORD);
  await page.goto('/payments');
  await expect(page.getByRole('heading', { name: 'Hóa đơn', exact: true })).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/1-danh-sach-hoa-don-le-tan.png` });

  await page.getByRole('button', { name: 'Tạo hóa đơn tại quầy' }).click();
  const dialog = page.locator('.ant-modal').filter({ hasText: 'Tạo hóa đơn tại quầy' });
  await dialog.getByLabel('Hội viên').fill(f.member.email);
  await page.locator('.ant-select-item-option').filter({ hasText: f.member.email }).click();
  await dialog.getByLabel('Gói đang bán').click();
  await page
    .locator('.ant-select-item-option')
    .filter({ hasText: plan.name })
    .click({ force: true });
  await dialog.locator('.ant-modal-title').click();
  await expect(dialog.getByText('Thu tiền sẽ gia hạn cộng dồn')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/2-tao-hoa-don-xem-tac-dong-gia-han.png` });
  await dialog.getByRole('button', { name: 'Tạo hóa đơn' }).click();

  const cash = page.locator('.ant-modal').filter({ hasText: 'Xác nhận thu tiền mặt' });
  await expect(cash.getByText('Thu tiền sẽ gia hạn cộng dồn')).toBeVisible();
  await expect(cash.getByText('300.000')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/3-xac-nhan-thu-tien-mat.png` });
  await cash.getByRole('button', { name: 'Đã nhận đủ tiền' }).click();

  const receipt = page.locator('.ant-modal').filter({ hasText: 'Chi tiết hoá đơn' });
  await expect(receipt.getByText('Đã thanh toán').first()).toBeVisible();
  await expect(receipt.getByText('Tiền mặt tại quầy')).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/4-bien-lai-da-thu-tien.png` });
  await receipt.locator('.ant-modal-close').click();
  await expect(receipt).toBeHidden();

  const channel = page.getByLabel('Lọc kênh thanh toán');
  await channel.click();
  await page.locator('.ant-select-item-option').filter({ hasText: 'Tại quầy' }).click();
  await page.getByRole('heading', { name: 'Hóa đơn', exact: true }).click();
  await expect(page.locator('.ant-tag').filter({ hasText: 'Online' })).toHaveCount(0);
  await settle(page);
  await page.screenshot({ path: `${SHOTS}/5-loc-theo-kenh-tai-quay.png` });

  const membership = await prisma.membership.findFirstOrThrow({ where: { userId: f.member.id } });
  const remainingDays = (membership.endDate.getTime() - Date.now()) / TIME.MS_PER_DAY;
  expect(remainingDays).toBeGreaterThan(39);
  expect(await prisma.membership.count({ where: { userId: f.member.id } })).toBe(1);
  expect(errors).toEqual([]);
});
