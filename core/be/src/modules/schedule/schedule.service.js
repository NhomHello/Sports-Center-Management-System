import { SETTING_KEYS as K } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { CLASS_LIMITS, TIME } from '../../constants/index.js';
import * as settings from '../setting/setting.service.js';
import { enrichClassView } from '../class/class-booking-policy.service.js';
import { CLASS_INCLUDE, toClassView } from '../class/class.mapper.js';
import { managementScope } from '../class/class-read.service.js';
import { startOfWeek } from './schedule.validation.js';

/** Mỗi event trong lịch có DTO lớp + quyền thao tác do server đánh giá. */
export const getWeek = async ({ weekStart, kind, context, roomId, coachId, subjectId }) => {
  const start = startOfWeek(weekStart);
  const end = new Date(start.getTime() + CLASS_LIMITS.DAYS_PER_WEEK * TIME.MS_PER_DAY);
  const memberId = context.user.id;
  const scope =
    kind === 'own'
      ? { enrollments: { some: { memberId } } }
      : kind === 'teaching'
        ? { sessions: { some: { coachId: memberId, startAt: { gte: start, lt: end } } } }
        : managementScope(context);
  const classes = await prisma.gymClass.findMany({
    where: {
      AND: [
        scope,
        {
          ...(subjectId && { subjectId }),
          sessions: { some: { startAt: { gte: start, lt: end } } },
        },
      ],
    },
    include: CLASS_INCLUDE,
    orderBy: { id: 'asc' },
  });
  const excuse = kind === 'own' ? await ownExcuseContext(memberId, start, end) : null;
  const result = [];
  for (const item of classes) {
    const dto = await enrichClassView(toClassView(item), memberId);
    const sessions = item.sessions.filter((s) =>
      matchesSession(s, { start, end, kind, memberId, roomId, coachId }, item),
    );
    result.push(
      ...sessions.map((session) => ({
        ...session,
        className: item.name,
        subject: item.subject.name,
        room: session.roomName ?? item.room.name,
        coach: session.coachName ?? item.coach.fullName,
        gymClass: dto,
        enrollmentStatus: kind === 'own' ? dto.enrollment?.status : null,
        ...(excuse && excuseFields(session, dto.enrollment, excuse)),
      })),
    );
  }
  return result.sort((a, b) => a.startAt - b.startAt);
};

/** Điểm danh của chính hội viên trong tuần + số giờ tối thiểu để báo nghỉ (GY-30). */
async function ownExcuseContext(memberId, start, end) {
  const [hours, rows] = await Promise.all([
    settings.getValue(K.CLASS_CANCEL_MIN_HOURS_BEFORE),
    prisma.attendance.findMany({
      where: { memberId, session: { startAt: { gte: start, lt: end } } },
      select: { sessionId: true, status: true },
    }),
  ]);
  return {
    hours,
    status: new Map(rows.map((row) => [row.sessionId, row.status])),
    now: new Date(),
  };
}

/** Hạn báo nghỉ của đúng buổi (không dùng hạn hủy toàn lớp) và trạng thái điểm danh hiện có. */
function excuseFields(session, enrollment, { hours, status, now }) {
  const excuseDeadline = new Date(session.startAt.getTime() - hours * TIME.MS_PER_HOUR);
  const attendanceStatus = status.get(session.id) ?? null;
  const canExcuse =
    enrollment?.status === Enums.EnrollmentStatus.BOOKED &&
    session.status === Enums.SessionStatus.SCHEDULED &&
    !attendanceStatus &&
    now <= excuseDeadline;
  return { excuseDeadline, attendanceStatus, canExcuse };
}

function matchesSession(session, filters, item) {
  if (session.startAt < filters.start || session.startAt >= filters.end) return false;
  const coachId = session.coachId ?? item.coachId;
  const roomId = session.roomId ?? item.roomId;
  if (filters.kind === 'teaching' && coachId !== filters.memberId) return false;
  if (filters.coachId && coachId !== filters.coachId) return false;
  return !filters.roomId || filters.roomId === roomId;
}
