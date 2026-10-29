import { Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { promoteWaitlist } from '../class/class-waitlist.service.js';
import {
  endPeriod,
  LIVE_STATUSES,
  shiftLaterPeriods,
  syncPeriods,
} from '../membership/membership-period.service.js';

const { PENDING_PAYMENT, DONE, CANCELLED } = Enums.PurchaseChangeStatus;

const lockSchedule = (db) => db.$queryRaw`SELECT id FROM schedule_locks WHERE id = 1 FOR UPDATE`;

/**
 * Đổi gói: kỳ cũ kết thúc, kỳ gói mới chiếm đúng chỗ của kỳ cũ (bắt đầu từ bây giờ hoặc từ ngày
 * kỳ cũ định bắt đầu), các kỳ mua nối tiếp dời theo thời hạn gói mới.
 */
const completePlanChange = async (db, change, invoice, now) => {
  const old = await db.membership.findUnique({ where: { id: change.fromMembershipId } });
  const start = old.startDate > now ? old.startDate : now;
  if (LIVE_STATUSES.includes(old.status)) await endPeriod(db, old, now);
  const days = invoice.durationDays ?? 0;
  const period = await db.membership.create({
    data: {
      userId: change.userId,
      planId: change.toPlanId,
      invoiceId: invoice.id,
      startDate: start,
      endDate: new Date(start.getTime() + days * TIME.MS_PER_DAY),
      status: Enums.MembershipStatus.ACTIVE,
    },
  });
  await shiftLaterPeriods(db, period, start, days * TIME.MS_PER_DAY);
  await db.invoice.update({ where: { id: invoice.id }, data: { membershipId: period.id } });
  await syncPeriods(db, change.userId, now);
  return period;
};

/** Đổi lớp: chỗ ở lớp mới thành chính thức, đăng ký lớp cũ hủy và nhả chỗ cho người chờ. */
const completeClassChange = async (db, change, invoice, now) => {
  const old = await db.classEnrollment.findUnique({ where: { id: change.fromEnrollmentId } });
  if (old.status === Enums.EnrollmentStatus.BOOKED)
    await db.classEnrollment.update({
      where: { id: old.id },
      data: {
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledAt: now,
        cancelledBy: change.actorId,
        exceptionUntil: null,
      },
    });
  const target = await db.classEnrollment.update({
    where: { classId_memberId: { classId: change.toClassId, memberId: change.userId } },
    data: {
      status: Enums.EnrollmentStatus.BOOKED,
      invoiceId: invoice.id,
      enrolledAt: now,
      holdExpiresAt: null,
      cancelledAt: null,
      cancelledBy: null,
    },
  });
  await promoteWaitlist(db, old.classId);
  return target;
};

/**
 * Chuyển quyền sang sản phẩm mới của một lần đổi và đánh dấu DONE. Gọi khi hóa đơn chênh lệch
 * đủ tiền, hoặc ngay khi tạo nếu không phải trả thêm.
 */
export const completeChange = async (db, change, invoice, now = new Date()) => {
  await lockSchedule(db);
  const granted =
    change.kind === Enums.PurchaseChangeKind.CHANGE_PLAN
      ? await completePlanChange(db, change, invoice, now)
      : await completeClassChange(db, change, invoice, now);
  await db.purchaseChange.update({
    where: { id: change.id },
    data: { status: DONE, completedAt: now },
  });
  return granted;
};

/** GY-35: hóa đơn chênh lệch đã thanh toán đủ (webhook, tiền mặt, số dư) thì hoàn tất đổi. */
export const onAdjustmentPaid = async (tx, invoice) => {
  const change = await tx.purchaseChange.findFirst({
    where: { adjustmentInvoiceId: invoice.id, status: PENDING_PAYMENT },
  });
  return change ? completeChange(tx, change, invoice) : null;
};

/** Hóa đơn chênh lệch hết hạn / bị hủy: lần đổi bị hủy, sản phẩm cũ giữ nguyên. */
export const cancelPendingChanges = (tx, invoiceId) =>
  tx.purchaseChange.updateMany({
    where: { adjustmentInvoiceId: invoiceId, status: PENDING_PAYMENT },
    data: { status: CANCELLED, completedAt: new Date() },
  });
