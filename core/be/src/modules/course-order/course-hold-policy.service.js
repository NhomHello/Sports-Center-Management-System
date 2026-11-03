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
  const held = await heldSeats(db, item.id, new Date(), invoice.userId);
  if (item._count.enrollments + held >= item.capacity)
    throw ApiError.conflict('Khoá học đã đủ chỗ, cần đối soát khoản tiền');
  return enrollment;
};
