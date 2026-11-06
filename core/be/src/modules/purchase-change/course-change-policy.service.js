import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { assertCourseHold } from '../course-order/course-hold-policy.service.js';

/** Recheck the source entitlement and the target seat under the schedule lock at settlement. */
export const assertCourseChangeHold = async (db, invoice, now = new Date()) => {
  if (now >= new Date(invoice.expiresAt))
    throw ApiError.conflict('Hóa đơn chênh lệch đã hết hạn, cần đối soát khoản tiền', {
      type: Enums.ReconciliationReason.LATE,
    });
  const change = await db.purchaseChange.findFirst({
    where: {
      adjustmentInvoiceId: invoice.id,
      status: Enums.PurchaseChangeStatus.PENDING_PAYMENT,
      kind: Enums.PurchaseChangeKind.CHANGE_CLASS,
    },
    include: { fromEnrollment: { include: { gymClass: true } }, toClass: true },
  });
  const source = change?.fromEnrollment;
  if (
    !source ||
    source.status !== Enums.EnrollmentStatus.BOOKED ||
    source.memberId !== invoice.userId ||
    change.toClassId !== invoice.classId
  )
    throw ApiError.conflict('Đăng ký khóa gốc hoặc yêu cầu đổi khóa không còn hiệu lực');
  if (source.gymClass.subjectId !== change.toClass.subjectId)
    throw ApiError.conflict('Khóa đích không còn cùng bộ môn với khóa gốc');
  return assertCourseHold(db, invoice, now, [source.classId]);
};

/** Both new course purchases and course adjustment invoices must still own their target seat. */
export const assertPurchaseHold = (db, invoice, now = new Date()) => {
  if (invoice.kind === Enums.InvoiceKind.COURSE) return assertCourseHold(db, invoice, now);
  if (invoice.kind === Enums.InvoiceKind.ADJUSTMENT && invoice.classId)
    return assertCourseChangeHold(db, invoice, now);
  return null;
};
