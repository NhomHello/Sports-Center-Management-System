import { Enums } from '../../config/db.js';
import { coursePrice, countedSessions, futureSessions } from '../cancellation/settlement.js';

export const PUBLIC_PERSON = Object.freeze({ id: true, fullName: true });
export const CLASS_INCLUDE = Object.freeze({
  subject: true,
  room: true,
  coach: { select: PUBLIC_PERSON },
  sessions: { orderBy: { startAt: 'asc' } },
  _count: { select: { enrollments: { where: { status: Enums.EnrollmentStatus.BOOKED } } } },
});

/** Học phí khóa: tổng buổi, buổi còn lại và giá cho phần còn lại (GY-20, đăng ký giữa khóa). */
export const coursePricing = (item, now = new Date()) => {
  const totalSessions = countedSessions(item.sessions ?? []).length;
  const remainingSessions = futureSessions(item.sessions ?? [], now).length;
  return {
    totalSessions,
    remainingSessions,
    priceForRemaining: coursePrice(item.price ?? 0, remainingSessions, totalSessions),
  };
};

/** Không gửi bản ghi user hay số đếm Prisma nội bộ ra giao diện. */
export const toClassView = ({ _count, ...item }) => ({
  ...item,
  ...coursePricing(item),
  seatsRemaining: Math.max(0, item.capacity - _count.enrollments),
  enrolledCount: _count.enrollments,
  startsOn: item.startsOn.toISOString().split('T')[0],
  endsOn: item.endsOn.toISOString().split('T')[0],
});
