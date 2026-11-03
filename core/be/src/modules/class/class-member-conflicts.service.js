import { Enums } from '../../config/db.js';
import { overlaps } from './class-schedule.service.js';

/** Đăng ký đang có hiệu lực gồm cả chỗ đang chờ thanh toán, cùng phạm vi cho checkout và thu tiền. */
export const findMemberScheduleConflict = async (db, { item, memberId }, now = new Date()) => {
  const sessions = item.sessions.filter(
    (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > now,
  );
  const others = await db.classEnrollment.findMany({
    where: {
      memberId,
      classId: { notIn: [item.id, ...(item.ignoreClassIds ?? [])] },
      OR: [
        { status: Enums.EnrollmentStatus.BOOKED },
        {
          status: Enums.EnrollmentStatus.PENDING_PAYMENT,
          invoice: { status: Enums.InvoiceStatus.PENDING },
        },
      ],
      gymClass: { status: { not: Enums.ClassStatus.CANCELLED } },
    },
    include: {
      gymClass: {
        include: {
          sessions: { where: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: now } } },
        },
      },
    },
  });
  for (const session of sessions) {
    for (const enrollment of others) {
      const conflict = enrollment.gymClass.sessions.find((other) => overlaps(session, other));
      if (conflict)
        return {
          sessionId: session.id,
          startAt: session.startAt,
          endAt: session.endAt,
          conflictingClassId: enrollment.classId,
          conflictingSessionId: conflict.id,
        };
    }
  }
  return null;
};
