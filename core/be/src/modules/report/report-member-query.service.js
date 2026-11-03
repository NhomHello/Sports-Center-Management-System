import { Enums } from '../../config/db.js';

const cohort = (query) => ({
  ...(query.classId && { classEnrollments: { some: { classId: query.classId } } }),
  ...(query.memberId && { id: query.memberId }),
});
const enrollmentScope = (query) => ({
  ...(query.memberId && { memberId: query.memberId }),
  ...(query.classId && { classId: query.classId }),
});
function loadClasses(db, query, range) {
  const scope = enrollmentScope(query);
  return db.gymClass.findMany({
    where: {
      status: { not: Enums.ClassStatus.CANCELLED },
      sessions: { some: { startAt: range, status: { not: Enums.SessionStatus.CANCELLED } } },
      ...((query.memberId || query.classId) && { enrollments: { some: scope } }),
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
/** Cùng cohort hội viên/gói cho mọi chỉ số; lọc trước khi tổng hợp và xuất. */
export const loadMemberReportData = (db, query, range) =>
  Promise.all([
    db.user.findMany({
      where: { role: { isDefault: true }, createdAt: range, ...cohort(query) },
      select: { createdAt: true },
    }),
    db.classEnrollment.findMany({
      where: { ...enrollmentScope(query), OR: [{ enrolledAt: range }, { cancelledAt: range }] },
      select: { enrolledAt: true, cancelledAt: true, status: true },
    }),
    loadClasses(db, query, range),
  ]);
