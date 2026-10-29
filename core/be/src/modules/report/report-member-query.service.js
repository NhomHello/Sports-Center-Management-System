import { Enums } from '../../config/db.js';

const cohort = (query) => ({
  ...(query.planId && { memberships: { some: { planId: query.planId } } }),
  ...(query.memberId && { id: query.memberId }),
});
const enrollmentScope = (query) => ({
  ...(query.memberId && { memberId: query.memberId }),
  ...(query.planId && { member: cohort(query) }),
});
function loadClasses(db, query, range) {
  const scope = enrollmentScope(query);
  return db.gymClass.findMany({
    where: {
      status: { not: Enums.ClassStatus.CANCELLED },
      sessions: { some: { startAt: range, status: { not: Enums.SessionStatus.CANCELLED } } },
      ...((query.memberId || query.planId) && { enrollments: { some: scope } }),
    },
    select: {
      capacity: true,
      sessions: {
        where: { status: { not: Enums.SessionStatus.CANCELLED } },
        select: { startAt: true },
      },
      enrollments: { where: scope, select: { enrolledAt: true, cancelledAt: true, status: true } },
    },
  });
}
function loadChanges(db, query, range) {
  return db.purchaseChange.findMany({
    where: {
      ...(query.memberId && { userId: query.memberId }),
      ...(query.planId && { user: cohort(query) }),
      status: Enums.PurchaseChangeStatus.DONE,
      kind: { in: [Enums.PurchaseChangeKind.CANCEL_PLAN, Enums.PurchaseChangeKind.CANCEL_COURSE] },
      completedAt: range,
    },
    select: { kind: true, completedAt: true },
  });
}
/** Cùng cohort hội viên/gói cho mọi chỉ số; lọc trước khi tổng hợp và xuất. */
export const loadMemberReportData = (db, query, range) =>
  Promise.all([
    db.user.findMany({
      where: { role: { isDefault: true }, createdAt: range, ...cohort(query) },
      select: { createdAt: true },
    }),
    db.membership.findMany({
      where: {
        ...(query.memberId && { userId: query.memberId }),
        ...(query.planId && { planId: query.planId }),
        startDate: { lt: range.lt },
        endDate: { gt: range.gte },
      },
      include: { freezes: true },
    }),
    db.classEnrollment.findMany({
      where: { ...enrollmentScope(query), OR: [{ enrolledAt: range }, { cancelledAt: range }] },
      select: { enrolledAt: true, cancelledAt: true, status: true },
    }),
    loadChanges(db, query, range),
    loadClasses(db, query, range),
  ]);
