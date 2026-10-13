import { Enums } from '../../config/db.js';

export const PUBLIC_PERSON = Object.freeze({ id: true, fullName: true });
export const CLASS_INCLUDE = Object.freeze({
  subject: true,
  room: true,
  coach: { select: PUBLIC_PERSON },
  sessions: { orderBy: { startAt: 'asc' } },
  _count: { select: { enrollments: { where: { status: Enums.EnrollmentStatus.BOOKED } } } },
});

/** Không gửi bản ghi user hay số đếm Prisma nội bộ ra giao diện. */
export const toClassView = ({ _count, ...item }) => ({
  ...item,
  seatsRemaining: Math.max(0, item.capacity - _count.enrollments),
  enrolledCount: _count.enrollments,
  startsOn: item.startsOn.toISOString().split('T')[0],
  endsOn: item.endsOn.toISOString().split('T')[0],
});
