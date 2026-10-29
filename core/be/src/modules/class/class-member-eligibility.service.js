import { Enums } from '../../config/db.js';
import { vietnamDateTime } from '../../common/utils/vietnam-date.js';

/** BR-2.17: vắng nhiều lần bị tạm chặn, áp dụng cho cả tự đăng ký lẫn đăng ký hộ. */
export const extraEnrollmentReason = async (db, memberId, _sessions, now) => {
  const user = await db.user.findUnique({ where: { id: memberId } });
  if (user?.bookingBlockedUntil > now)
    return `Tạm chặn đăng ký đến ${vietnamDateTime(user.bookingBlockedUntil)}`;
  return null;
};

/**
 * Chỗ đang bị giữ chiếm sức chứa như một booking: lời mời danh sách chờ còn hạn và đăng ký khóa
 * học đang chờ thanh toán (hóa đơn còn PENDING; hết hạn thì job nhả chỗ).
 */
export const heldSeats = async (db, classId, now, exceptMemberId) => {
  const except = exceptMemberId && { memberId: { not: exceptMemberId } };
  const [offered, pending] = await Promise.all([
    db.classWaitlist.count({
      where: {
        classId,
        status: Enums.WaitlistStatus.OFFERED,
        offeredUntil: { gt: now },
        ...except,
      },
    }),
    db.classEnrollment.count({
      where: {
        classId,
        status: Enums.EnrollmentStatus.PENDING_PAYMENT,
        invoice: { status: Enums.InvoiceStatus.PENDING },
        ...except,
      },
    }),
  ]);
  return offered + pending;
};
