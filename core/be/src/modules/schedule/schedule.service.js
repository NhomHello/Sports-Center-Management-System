import { ApiError } from '../../common/errors/api-error.js';
import { vnRange } from '../../common/utils/vn-date.js';
import { Enums, prisma } from '../../config/db.js';

const CLASS_BRIEF = {
  select: {
    id: true,
    name: true,
    subject: { select: { id: true, name: true } },
    room: { select: { id: true, name: true } },
    coach: { select: { id: true, fullName: true } },
  },
};

const toSessionView = (session) => ({
  id: session.id,
  startAt: session.startAt,
  endAt: session.endAt,
  status: session.status,
  class: session.gymClass,
});

/**
 * UC-CB-16: lịch tập của chính hội viên (id lấy từ token, không nhận từ client). Giữ cả booking
 * đã huỷ và buổi bị huỷ để hội viên thấy thay đổi; gói hết hạn giữa kỳ không ẩn booking cũ (BR-1.12).
 * @param {number} userId
 * @param {{ from: string, to: string }} range ngày theo giờ Việt Nam, gồm cả ngày `to`
 */
export const getMySchedule = async (userId, { from, to }) => {
  const { start, end } = vnRange(from, to);
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, session: { startAt: { gte: start, lt: end } } },
    orderBy: { session: { startAt: 'asc' } },
    include: { session: { include: { gymClass: CLASS_BRIEF } } },
  });
  return enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    bookingStatus: enrollment.status,
    cancelledAt: enrollment.cancelledAt,
    ...toSessionView(enrollment.session),
  }));
};

/**
 * UC-CB-11: lịch dạy. Coach chỉ xem lớp của mình; người có quyền xem mọi lớp mới được chọn coachId khác.
 * @param {{ userId: number, canReadAll: boolean }} actor
 * @param {{ from: string, to: string, coachId?: number }} query
 */
export const getTeachingSchedule = async ({ userId, canReadAll }, { from, to, coachId }) => {
  if (coachId && coachId !== userId && !canReadAll) throw ApiError.forbidden();
  const { start, end } = vnRange(from, to);
  const sessions = await prisma.classSession.findMany({
    where: { startAt: { gte: start, lt: end }, gymClass: { coachId: coachId ?? userId } },
    orderBy: { startAt: 'asc' },
    include: {
      gymClass: CLASS_BRIEF,
      _count: { select: { enrollments: { where: { status: Enums.EnrollmentStatus.BOOKED } } } },
    },
  });
  return sessions.map((session) => ({
    ...toSessionView(session),
    bookedCount: session._count.enrollments,
  }));
};
