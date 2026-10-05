import { Enums } from '../../config/db.js';
import { overlaps } from './class-schedule.service.js';

/** Hội viên bị lịch mới gây xung đột có thể huỷ toàn lớp trước buổi xung đột đầu tiên. */
export const refreshCancellationExceptions = async (db, classId, sessions) => {
  const enrollments = await db.classEnrollment.findMany({
    where: { classId, status: Enums.EnrollmentStatus.BOOKED },
  });
  for (const enrollment of enrollments) {
    const others = await db.classEnrollment.findMany({
      where: {
        memberId: enrollment.memberId,
        classId: { not: classId },
        status: Enums.EnrollmentStatus.BOOKED,
      },
      include: {
        gymClass: {
          include: {
            sessions: {
              where: {
                status: Enums.SessionStatus.SCHEDULED,
                endAt: { gt: new Date() },
              },
            },
          },
        },
      },
    });
    const conflicts = sessions.filter((s) =>
      others.some((e) => e.gymClass.sessions.some((other) => overlaps(s, other))),
    );
    await db.classEnrollment.update({
      where: { id: enrollment.id },
      data: { exceptionUntil: conflicts[0]?.startAt ?? null },
    });
  }
};
