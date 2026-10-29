import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { releaseCourseHold } from '../course-order/course-hold.service.js';
import { addCredit } from '../credit/credit.service.js';
import { payOut } from './payout.service.js';
import { paidValue } from './purchase-value.service.js';
import { futureSessions, remainingCourseValue, roundMoney } from './settlement.js';

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
 * Trung tâm hủy cả lớp: học viên đã thanh toán được ghi số dư toàn bộ phần chưa học (không phí),
 * giữ chỗ chưa thanh toán được nhả. Gọi trước khi các buổi tương lai bị hủy.
 */
export const compensateClassCancelled = async (db, item, actor) => {
  for (const enrollment of await paidEnrollments(db, item.id)) {
    const paid = await paidValue(db, enrollment.invoice);
    const sessionCount = enrollment.invoice.sessionCount ?? 0;
    const unheld = futureSessions(enrollment.gymClass.sessions).length;
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
        settlement: Enums.SettlementMode.CREDIT,
        completedAt: new Date(),
      },
    });
    await payOut(db, {
      change,
      amount: remainingValue,
      settlement: Enums.SettlementMode.CREDIT,
      actor,
      reason: `Trung tâm hủy lớp ${item.name}: hoàn phần chưa học vào số dư`,
    });
  }
  const holds = await db.classEnrollment.findMany({
    where: { classId: item.id, status: Enums.EnrollmentStatus.PENDING_PAYMENT },
  });
  for (const hold of holds) await releaseQuietly(db, hold, actor);
};

/** Trung tâm hủy một buổi: học viên đã thanh toán được ghi số dư giá trị một buổi. */
export const compensateSessionCancelled = async (db, session, actor) => {
  for (const enrollment of await paidEnrollments(db, session.classId)) {
    const sessionCount = enrollment.invoice.sessionCount ?? 0;
    if (!sessionCount) continue;
    const amount = roundMoney((await paidValue(db, enrollment.invoice)) / sessionCount);
    if (amount <= 0) continue;
    await addCredit(db, {
      userId: enrollment.memberId,
      amount,
      reason: Enums.CreditReason.ADJUSTMENT,
      invoiceId: enrollment.invoiceId,
      note: `Trung tâm hủy buổi ${session.gymClass.name}: hoàn giá trị một buổi vào số dư`,
      actorId: actor.id,
    });
  }
};
