import { Enums } from '../../config/db.js';
import { COURSE_LIMITS } from './course.constants.js';

/** BR-S4-06: chỉ buổi thực học sau ngày đăng ký; xin nghỉ không nằm trong mẫu số. */
export const calculateAttendance = (sessions, rows, enrolledAt) => {
  const eligible = sessions.filter(
    (s) => s.status !== Enums.SessionStatus.CANCELLED && s.startAt >= enrolledAt,
  );
  const recorded = new Map(rows.map((row) => [row.sessionId, row.status]));
  const counts = { total: eligible.length, present: 0, absent: 0, excused: 0, missing: 0 };
  const keys = {
    [Enums.AttendanceStatus.PRESENT]: 'present',
    [Enums.AttendanceStatus.ABSENT]: 'absent',
    [Enums.AttendanceStatus.EXCUSED]: 'excused',
  };
  for (const session of eligible) counts[keys[recorded.get(session.id)] ?? 'missing'] += 1;
  const denominator = counts.total - counts.excused;
  return {
    ...counts,
    percent: denominator
      ? Math.round((counts.present / denominator) * COURSE_LIMITS.PERCENT_SCALE) /
        COURSE_LIMITS.PRECISION
      : 0,
  };
};

/** Chuyên cần luôn tính từ server; snapshot chỉ chốt khi công bố. */
export const loadAttendance = async (db, summary) => {
  const [sessions, rows, enrollments] = await Promise.all([
    db.classSession.findMany({ where: { classId: summary.classId, endAt: { lte: new Date() } } }),
    db.attendance.findMany({ where: { session: { classId: summary.classId } } }),
    db.classEnrollment.findMany({ where: { classId: summary.classId } }),
  ]);
  return new Map(
    summary.items.map((item) => {
      const enrolledAt =
        enrollments.find((e) => e.memberId === item.memberId)?.enrolledAt ??
        summary.gymClass.createdAt;
      return [
        item.id,
        calculateAttendance(
          sessions,
          rows.filter((r) => r.memberId === item.memberId),
          enrolledAt,
        ),
      ];
    }),
  );
};
