import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';

const OVERLAP_MESSAGE = 'Trùng giờ với một buổi đã đăng ký khác';

/**
 * Khoá hàng buổi học (SELECT ... FOR UPDATE) rồi đọc lại cùng lớp: hai người giành chỗ cuối
 * phải xếp hàng, chỉ người đầu tiên thấy còn chỗ (BR-2.2).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {number} sessionId
 */
export const lockSession = async (tx, sessionId) => {
  await tx.$queryRaw`SELECT id FROM class_sessions WHERE id = ${sessionId} FOR UPDATE`;
  const session = await tx.classSession.findUnique({
    where: { id: sessionId },
    include: { gymClass: true },
  });
  if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
  return session;
};

/** BR-2.6: lớp đang mở, trong thời gian đăng ký, buổi chưa diễn ra và chưa bị huỷ. */
export const assertOpenForBooking = (session, now) => {
  const { gymClass } = session;
  if (gymClass.status !== Enums.ClassStatus.OPEN) {
    throw ApiError.businessRule('Lớp không còn nhận đăng ký');
  }
  if (now < gymClass.registrationStartAt || now > gymClass.registrationEndAt) {
    throw ApiError.businessRule('Lớp không trong thời gian mở đăng ký');
  }
  if (session.status !== Enums.SessionStatus.SCHEDULED || session.startAt <= now) {
    throw ApiError.businessRule('Buổi học đã diễn ra hoặc đã bị huỷ');
  }
};

/** BR-2.1/1.5: hội viên phải có gói còn hiệu lực tại thời điểm đăng ký. */
export const assertActiveMembership = async (tx, memberId, now) => {
  const membership = await tx.membership.findFirst({
    where: {
      userId: memberId,
      status: Enums.MembershipStatus.ACTIVE,
      startDate: { lte: now },
      endDate: { gt: now },
    },
    select: { id: true },
  });
  if (!membership)
    throw ApiError.businessRule('Hội viên cần có gói tập còn hiệu lực để đăng ký lớp');
};

/** BR-2.2: không vượt sức chứa của lớp (đếm trong cùng transaction đã khoá buổi). */
export const assertCapacity = async (tx, session) => {
  const booked = await tx.enrollment.count({
    where: { sessionId: session.id, status: Enums.EnrollmentStatus.BOOKED },
  });
  if (booked >= session.gymClass.capacity) throw ApiError.conflict('Lớp đã hết chỗ');
};

/** BR-2.3/2.8: không trùng giờ với buổi khác đang BOOKED; buổi sát giờ (không giao nhau) vẫn được. */
export const assertNoOverlap = async (tx, session, memberId) => {
  const clash = await tx.enrollment.findFirst({
    where: {
      userId: memberId,
      status: Enums.EnrollmentStatus.BOOKED,
      sessionId: { not: session.id },
      session: {
        status: Enums.SessionStatus.SCHEDULED,
        startAt: { lt: session.endAt },
        endAt: { gt: session.startAt },
      },
    },
    select: { id: true },
  });
  if (clash) throw ApiError.conflict(OVERLAP_MESSAGE);
};
