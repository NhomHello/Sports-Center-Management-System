import { prisma } from '../../config/db.js';
import { CLASS_LIMITS, TIME } from '../../constants/index.js';
import { enrichClassView } from '../class/class-booking-policy.service.js';
import { CLASS_INCLUDE, toClassView } from '../class/class.mapper.js';
import { managementScope } from '../class/class-read.service.js';
import { startOfWeek } from './schedule.validation.js';

/** Mỗi event trong lịch có DTO lớp + quyền thao tác do server đánh giá. */
export const getWeek = async ({ weekStart, kind, context }) => {
  const start = startOfWeek(weekStart);
  const end = new Date(start.getTime() + CLASS_LIMITS.DAYS_PER_WEEK * TIME.MS_PER_DAY);
  const memberId = context.user.id;
  const scope =
    kind === 'own'
      ? { enrollments: { some: { memberId } } }
      : kind === 'teaching'
        ? { coachId: memberId }
        : managementScope(context);
  const classes = await prisma.gymClass.findMany({
    where: { ...scope, sessions: { some: { startAt: { gte: start, lt: end } } } },
    include: CLASS_INCLUDE,
    orderBy: { id: 'asc' },
  });
  const result = [];
  for (const item of classes) {
    const dto = await enrichClassView(toClassView(item), memberId);
    const sessions = item.sessions.filter((s) => s.startAt >= start && s.startAt < end);
    result.push(
      ...sessions.map((session) => ({
        ...session,
        className: item.name,
        subject: item.subject.name,
        room: session.roomName ?? item.room.name,
        coach: session.coachName ?? item.coach.fullName,
        gymClass: dto,
        enrollmentStatus: kind === 'own' ? dto.enrollment?.status : null,
      })),
    );
  }
  return result.sort((a, b) => a.startAt - b.startAt);
};
