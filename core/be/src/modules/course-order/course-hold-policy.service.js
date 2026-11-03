import { findMemberScheduleConflict } from '../class/class-member-conflicts.service.js';
import { Enums } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { heldSeats } from '../class/class-member-eligibility.service.js';

/** Không phục hồi đăng ký đã huỷ hoặc đổi sang invoice khác khi tiền về trễ. */
export const assertCourseHold = async (db, invoice) => {
  const enrollment = await db.classEnrollment.findFirst({
    where: {
      invoiceId: invoice.id,
      classId: invoice.classId,
      memberId: invoice.userId,
      status: Enums.EnrollmentStatus.PENDING_PAYMENT,
    },
    include: {
      gymClass: {
        include: {
          sessions: true,
          _count: { select: { enrollments: { where: { status: Enums.EnrollmentStatus.BOOKED } } } },
        },
      },
    },
  });
  if (!enrollment)
    throw ApiError.conflict('Chỗ giữ đã thay đổi, cần đối soát khoản tiền thay vì tự đăng ký');
  const item = enrollment.gymClass;
  if (
    ![Enums.ClassStatus.OPEN, Enums.ClassStatus.CLOSED].includes(item.status) ||
    !item.sessions.some((s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > new Date())
  )
    throw ApiError.conflict('Khoá học không còn nhận thanh toán');
  const conflict = await findMemberScheduleConflict(db, { item, memberId: invoice.userId });
  if (conflict)
    throw ApiError.conflict(
      'Lịch khóa học đã thay đổi và trùng với khóa khác của học viên. Cần chọn lại khóa hoặc đối soát tiền đã chuyển.',
      { ...conflict, type: Enums.ReconciliationReason.SCHEDULE_CONFLICT },
    );
  const held = await heldSeats(db, item.id, new Date(), invoice.userId);
  if (item._count.enrollments + held >= item.capacity)
    throw ApiError.conflict('Khoá học đã đủ chỗ, cần đối soát khoản tiền');
  return enrollment;
};

/** Kiểm tra hiển thị trước khi chuyển tiền; phép ghi vẫn kiểm tra lại dưới khóa transaction. */
export const pendingCourseConflict = async (db, invoice) => {
  if (
    invoice.kind !== Enums.InvoiceKind.COURSE ||
    invoice.status !== Enums.InvoiceStatus.PENDING ||
    !invoice.classId
  )
    return null;
  const item = await db.gymClass.findUnique({
    where: { id: invoice.classId },
    include: { sessions: true },
  });
  return item ? findMemberScheduleConflict(db, { item, memberId: invoice.userId }) : null;
};
