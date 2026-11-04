import { Enums } from '../../config/db.js';

export const PERSON = Object.freeze({ id: true, fullName: true });
export const COURSE_SUMMARY = {
  subject: { select: { name: true } },
  coach: { select: PERSON },
  _count: { select: { sessions: true } },
};
/** Tóm tắt chỉ có đăng ký của hội viên đang được xem, không trả danh sách học viên khác. */
export const courseView = (item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  status: item.status,
  startsOn: item.startsOn,
  endsOn: item.endsOn,
  subject: item.subject.name,
  coach: item.coach,
  totalSessions: item._count.sessions,
  enrollmentStatus: item.enrollments[0]?.status ?? null,
});

const periodForChange = (change, logs) => {
  const meta = logs.find((log) => log.entityId === String(change.id))?.meta;
  const original = meta?.cancellation?.enrolledAt;
  const from = original
    ? new Date(original)
    : (change.fromInvoice.paidAt ?? change.fromInvoice.createdAt);
  return { from, until: change.createdAt };
};

/** Khoảng tham gia cũ vẫn được giữ khi đăng ký lại ghi đè bản ghi enrollment hiện tại. */
export const membershipPeriods = (enrollment, changes, logs = []) => {
  const periods = changes.map((change) => periodForChange(change, logs));
  if (!enrollment) return periods;
  if (enrollment.status === Enums.EnrollmentStatus.BOOKED)
    periods.push({ from: enrollment.enrolledAt, until: null });
  if (enrollment.status === Enums.EnrollmentStatus.CANCELLED && enrollment.cancelledAt)
    periods.push({ from: enrollment.enrolledAt, until: enrollment.cancelledAt });
  return periods;
};

const sessionCoach = (session, fallback) => ({
  id: session.coachId ?? fallback?.id ?? null,
  fullName: session.coachName ?? session.coach?.fullName ?? fallback?.fullName ?? null,
});

/** Buổi không có bản ghi vẫn hiện; null không được suy thành vắng mặt. */
export const sessionView = (session, number, periods, fallbackCoach) => ({
  id: session.id,
  number,
  startAt: session.startAt,
  endAt: session.endAt,
  status: session.status,
  description: session.description,
  coach: sessionCoach(session, fallbackCoach),
  inEnrollmentPeriod: periods.some(
    (period) => period.from <= session.startAt && (!period.until || session.startAt < period.until),
  ),
  attendance: session.attendance[0] ?? null,
  feedback: session.feedback[0] ?? null,
});
