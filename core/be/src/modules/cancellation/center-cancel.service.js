import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { releaseCourseHold } from '../course-order/course-hold.service.js';
import { notifyRefundRequested } from '../reconciliation/refund-notification.service.js';
import { recordCourseCancellation } from './cancellation-record.service.js';
import { payOut } from './payout.service.js';
import { paidValue } from './purchase-value.service.js';
import { courseUsage, remainingCourseValue, roundMoney } from './settlement.js';

const paidEnrollments = (db, classId) =>
  db.classEnrollment.findMany({
    where: { classId, status: Enums.EnrollmentStatus.BOOKED, invoiceId: { not: null } },
    include: { invoice: true, gymClass: { include: { sessions: true } } },
  });

/** Lỗi nghiệp vụ của một giữ chỗ (đã nhận tiền) không chặn việc hủy lớp; xử lý qua đối soát. */
const releaseQuietly = async (db, hold, actor) => {
  try {
    await releaseCourseHold(db, hold, actor);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
  }
};

/**
 * Trung tâm hủy cả lớp: học viên đã thanh toán có yêu cầu hoàn toàn bộ phần chưa học (không phí),
 * giữ chỗ chưa thanh toán được nhả. Gọi trước khi các buổi tương lai bị hủy.
 */
export const compensateClassCancelled = async (db, item, actor) => {
  for (const enrollment of await paidEnrollments(db, item.id)) {
    const paid = await paidValue(db, enrollment.invoice);
    const sessionCount = enrollment.invoice.sessionCount ?? 0;
    const usage = courseUsage({
      sessions: enrollment.gymClass.sessions,
      enrolledAt: enrollment.enrolledAt,
      sessionCount,
    });
    const unheld = usage.remainingSessions;
    const remainingValue = remainingCourseValue({ paid, sessionCount, unheld });
    if (!remainingValue) continue;
    const change = await db.purchaseChange.create({
      data: {
        kind: Enums.PurchaseChangeKind.CANCEL_COURSE,
        userId: enrollment.memberId,
        actorId: actor.id,
        fromInvoiceId: enrollment.invoiceId,
        fromEnrollmentId: enrollment.id,
        paidAmount: paid,
        remainingValue,
        difference: -remainingValue,
        settlement: Enums.SettlementMode.REFUND,
        completedAt: new Date(),
      },
    });
    const done = await payOut(db, {
      change,
      amount: remainingValue,
      settlement: Enums.SettlementMode.REFUND,
      actor,
      reason: `Trung tâm hủy lớp ${item.name}: hoàn phần chưa học`,
    });
    await recordCourseCancellation(db, {
      change: done,
      enrollment,
      value: {
        invoice: enrollment.invoice,
        sessionCount,
        ...usage,
      },
      preview: { paidAmount: paid, remainingValue, fee: 0, refundAmount: remainingValue },
      actor,
      reason: `Trung tâm hủy lớp ${item.name}`,
    });
  }
  const holds = await db.classEnrollment.findMany({
    where: { classId: item.id, status: Enums.EnrollmentStatus.PENDING_PAYMENT },
  });
  for (const hold of holds) await releaseQuietly(db, hold, actor);
};

/** Trung tâm hủy một buổi: học viên đã thanh toán có yêu cầu hoàn giá trị một buổi. */
export const compensateSessionCancelled = async (db, session, actor) => {
  for (const enrollment of await paidEnrollments(db, session.classId)) {
    const sessionCount = enrollment.invoice.sessionCount ?? 0;
    if (!sessionCount) continue;
    const amount = roundMoney((await paidValue(db, enrollment.invoice)) / sessionCount);
    if (amount <= 0) continue;
    const reason = `Trung tâm hủy buổi ${session.gymClass.name}: hoàn giá trị một buổi`;
    const refund = await db.refund.create({
      data: { invoiceId: enrollment.invoiceId, amount, reason, requestedById: actor.id },
    });
    await notifyRefundRequested(db, refund, { userId: enrollment.memberId, reason });
  }
};
