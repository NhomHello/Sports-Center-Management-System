import { randomUUID } from 'node:crypto';
import { PERMISSIONS } from '@scms/shared';
import { prisma } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { join as joinWaitlist } from '../../../src/modules/class/class-waitlist.service.js';
import { enroll } from '../../../src/modules/class/class-enrollment.service.js';
import { freeze } from '../../../src/modules/membership/membership-freeze.service.js';
import { processSepayWebhook } from '../../../src/modules/payment/sepay-webhook.service.js';
import { createClaim } from '../../../src/modules/reconciliation/payment-claim.service.js';
import { updateStatus } from '../../../src/modules/user/user.service.js';
import { orderOnline, payAtCounter, payOnline, simulateTransfer } from './payments.demo.js';

const DAY = TIME.MS_PER_DAY;
const vnDate = (ms) => new Date(ms + 7 * TIME.MS_PER_HOUR).toISOString().slice(0, 10);
const membershipOf = (member) =>
  prisma.membership.findFirstOrThrow({ where: { userId: member.id } });

/** member1–4: đã có gói, giữ chỗ lớp, danh sách chờ, mua tại quầy (Phần A, B-3, B-4, B-13). */
const seedActiveMembers = async ({ users: u, plans }, classes) => {
  await payOnline(u.member1, plans.ACTIVE_90);
  await payOnline(u.member2, plans.ACTIVE_90);
  await payOnline(u.member3, plans.STARTER_30);
  await payAtCounter(u.member4, plans.STARTER_30, u.letan);
  // Lớp 2 chỗ đầy với member1, member2; member3 đứng đầu danh sách chờ.
  await enroll(classes.boxingSmall.id, u.member1.id, u.member1);
  await enroll(classes.boxingSmall.id, u.member2.id, u.member2);
  await joinWaitlist(classes.boxingSmall.id, u.member3);
  await enroll(classes.yogaEvening.id, u.member1.id, u.member1);
};

/** member5–9: các ca thanh toán online cần đối soát (B-2, B-5 … B-8). */
const seedPaymentCases = async ({ users: u, plans }) => {
  await orderOnline(u.member5, plans.STARTER_30);
  const underpaid = await orderOnline(u.member6, plans.STARTER_30);
  await simulateTransfer(underpaid, 200000);
  const overpaid = await orderOnline(u.member7, plans.TRIAL_7);
  await simulateTransfer(overpaid, 200000);
  const twice = await payOnline(u.member8, plans.TRIAL_7);
  await simulateTransfer(twice, twice.amount);
  const claimed = await orderOnline(u.member9, plans.STARTER_30);
  await createClaim(
    claimed.id,
    {
      transferredAt: new Date(Date.now() - 10 * TIME.MS_PER_MINUTE),
      amount: claimed.amount,
      bankName: 'Vietcombank',
      reference: 'FT-CLAIM-DEMO',
      note: 'Em đã chuyển khoản nhưng chưa thấy cập nhật',
    },
    u.member9,
  );
  // Giao dịch quên ghi mã hoá đơn: phiếu "Sai hoặc thiếu mã" (B-9).
  await processSepayWebhook({
    id: randomUUID(),
    gateway: 'MBBank',
    transferType: 'in',
    transferAmount: plans.STARTER_30.price,
    code: null,
    content: 'NGUYEN VAN A chuyen tien tap gym',
    referenceCode: 'FTNOCODE01',
  });
};

/** member10–15: ngoại lệ gói và tài khoản (B-1, B-11, B-12, B-14, B-15). */
const seedMemberExceptions = async ({ users: u, plans }, classes) => {
  const manager = { user: u.quanly, permissions: new Set([PERMISSIONS.MEMBERSHIP_FREEZE_ALL]) };
  await payOnline(u.member10, plans.TRIAL_7);
  await prisma.membership.update({
    where: { id: (await membershipOf(u.member10)).id },
    data: { endDate: new Date(Date.now() + 3 * DAY) },
  });
  // Đăng ký lớp kéo dài quá ngày hết hạn gói: được phép nhưng có cảnh báo (BR-1.12).
  await enroll(classes.yogaEvening.id, u.member10.id, u.member10);
  await payOnline(u.member11, plans.STARTER_30);
  const today = Date.now();
  const range = { from: vnDate(today), to: vnDate(today + 10 * DAY) };
  const frozen = await freeze((await membershipOf(u.member11)).id, range, manager);
  // Lùi ngày bắt đầu bảo lưu 3 ngày để demo "kết thúc bảo lưu sớm" thấy được số ngày cộng bù.
  await prisma.membershipFreeze.update({
    where: { id: frozen.id },
    data: { startAt: new Date(today - 3 * DAY) },
  });
  await payOnline(u.member12, plans.TRIAL_7);
  await prisma.membership.update({
    where: { id: (await membershipOf(u.member12)).id },
    data: {
      startDate: new Date(today - 9 * DAY),
      endDate: new Date(today - 2 * DAY),
      status: 'EXPIRED',
      activeUserId: null,
    },
  });
  await prisma.user.update({ where: { id: u.member13.id }, data: { emailVerifiedAt: null } });
  await payOnline(u.member14, plans.STARTER_30);
  await prisma.user.update({
    where: { id: u.member14.id },
    data: { bookingBlockedUntil: new Date(today + 5 * DAY) },
  });
  await updateStatus(u.member15.id, 'INACTIVE', u.quanly, true);
};

/**
 * Dựng 15 tình huống của tài liệu demo (docs/kiem-thu/nghiem-thu/LoTrinh_Demo_*.md, mục 1.2)
 * cho member1–member15.
 */
export const seedDemoScenarios = async (catalog, classes) => {
  await seedActiveMembers(catalog, classes);
  await seedPaymentCases(catalog);
  await seedMemberExceptions(catalog, classes);
};
