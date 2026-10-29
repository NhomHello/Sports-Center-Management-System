import { SETTING_KEYS as K } from '@scms/shared';
import { prisma, Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';
const isTaught = (s, item, id) => (s.coachId ?? item.coachId) === id;
/** BR-S4-03: xét buổi thực dạy và ngày đăng ký/huỷ, không cấp quyền chỉ vì từng là HLV lớp. */
export const canViewEnrollment = (row, scope) => {
  const item = row.gymClass;
  if (item.status === Enums.ClassStatus.CANCELLED) return false;
  const sessions = item.sessions.filter((s) => s.status !== Enums.SessionStatus.CANCELLED);
  const taught = sessions.filter(
    (s) =>
      isTaught(s, item, scope.coachId) &&
      s.startAt >= row.enrolledAt &&
      (!row.cancelledAt || s.startAt < row.cancelledAt),
  );
  if (!taught.length) return false;
  const current =
    row.status === Enums.EnrollmentStatus.BOOKED && taught.some((s) => s.endAt >= scope.now);
  const lastEnd = Math.max(...sessions.map((s) => s.endAt.getTime()));
  const learned = taught.some((s) => s.endAt <= scope.now);
  return (
    current || (learned && lastEnd <= scope.now.getTime() && lastEnd >= scope.cutoff.getTime())
  );
};
/** Scope chung cho danh sách và chi tiết; không tải invoice/membership/số dư. */
export const assignedEnrollments = async (coachId, memberId) => {
  const now = new Date();
  const days = await getValue(K.COACH_MEMBER_VIEW_DAYS);
  const scope = { coachId, now, cutoff: new Date(now.getTime() - days * TIME.MS_PER_DAY) };
  const rows = await prisma.classEnrollment.findMany({
    where: {
      ...(memberId && { memberId }),
      gymClass: { OR: [{ coachId }, { sessions: { some: { coachId } } }] },
    },
    include: {
      gymClass: { include: { sessions: { orderBy: { startAt: 'asc' } } } },
      member: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });
  return rows.filter((row) => canViewEnrollment(row, scope));
};
