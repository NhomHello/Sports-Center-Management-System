import { Enums, prisma } from '../../config/db.js';
import { assertReportRange, bucketRanges, periodKey, reportRange } from './report-periods.js';
const PERCENT = 100;
const inside = (value, range) => value && value >= range.start && value < range.end;

/** Dùng cùng bộ chia kỳ với doanh thu; chỉ kỳ gói có phần hiệu lực ngoài bảo lưu mới tính. */
export const memberReport = async (query) => {
  await assertReportRange(query);
  const range = reportRange(query);
  return prisma.$transaction(async (db) => {
    const [members, periods, enrollments, changes, classes] = await Promise.all([
      db.user.findMany({ where: { role: { isDefault: true }, createdAt: range, ...(query.memberId && { id: query.memberId }) }, select: { createdAt: true } }),
      db.membership.findMany({ where: { ...(query.memberId && { userId: query.memberId }), ...(query.planId && { planId: query.planId }),
        startDate: { lt: range.lt }, endDate: { gt: range.gte } }, include: { freezes: true } }),
      db.classEnrollment.findMany({ where: { ...(query.memberId && { memberId: query.memberId }),
        OR: [{ enrolledAt: range }, { cancelledAt: range }] }, select: { enrolledAt: true, cancelledAt: true, status: true } }),
      db.purchaseChange.findMany({ where: { ...(query.memberId && { userId: query.memberId }), status: Enums.PurchaseChangeStatus.DONE,
        kind: { in: [Enums.PurchaseChangeKind.CANCEL_PLAN, Enums.PurchaseChangeKind.CANCEL_COURSE] }, completedAt: range }, select: { kind: true, completedAt: true } }),
      db.gymClass.findMany({ where: { status: { not: Enums.ClassStatus.CANCELLED }, sessions: { some: { startAt: range } } },
        select: { capacity: true, sessions: { where: { status: { not: Enums.SessionStatus.CANCELLED } }, select: { startAt: true } },
          enrollments: { select: { enrolledAt: true, cancelledAt: true, status: true } } } }),
    ]);
    const rows = bucketRanges(query).map((bucket) => {
      const scheduled = classes.filter((c) => c.sessions.some((s) => inside(s.startAt, bucket)));
      const capacity = scheduled.reduce((sum, c) => sum + c.capacity, 0);
      const booked = scheduled.reduce((sum, c) => sum + c.enrollments.filter((e) =>
        e.enrolledAt < bucket.end && (!e.cancelledAt || e.cancelledAt > bucket.start) && e.status !== Enums.EnrollmentStatus.PENDING_PAYMENT).length, 0);
      return { date: bucket.key, newMembers: members.filter((m) => periodKey(m.createdAt, query.groupBy) === bucket.key).length,
        activePeriods: periods.filter((m) => activeInBucket(m, bucket)).length,
        newEnrollments: enrollments.filter((e) => inside(e.enrolledAt, bucket)).length,
        cancelledPlans: changes.filter((c) => c.kind === Enums.PurchaseChangeKind.CANCEL_PLAN && inside(c.completedAt, bucket)).length,
        cancelledEnrollments: enrollments.filter((e) => inside(e.cancelledAt, bucket)).length,
        classCount: scheduled.length, seats: capacity, booked, occupancyPercent: capacity ? booked / capacity * PERCENT : 0 };
    });
    return { filters: { ...query, groupBy: query.groupBy ?? 'day' }, rows };
  }, { isolationLevel: Enums.TransactionIsolationLevel.RepeatableRead });
};
function activeInBucket(membership, bucket) {
  const start = Math.max(membership.startDate.getTime(), bucket.start.getTime());
  const end = Math.min(membership.endDate.getTime(), bucket.end.getTime());
  if (end <= start) return false;
  return !membership.freezes.some((f) => f.startAt.getTime() <= start && (f.endedAt ?? f.endAt).getTime() >= end);
}
