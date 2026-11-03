import { loadMemberReportData } from './report-member-query.service.js';
import { Enums, prisma } from '../../config/db.js';
import { assertReportRange, bucketRanges, periodKey, reportRange } from './report-periods.js';
const PERCENT = 100;
const inside = (value, range) => value && value >= range.start && value < range.end;

/** Dùng cùng bộ chia kỳ với doanh thu; chỉ kỳ gói có phần hiệu lực ngoài bảo lưu mới tính. */
export const memberReport = async (query) => {
  await assertReportRange(query);
  const range = reportRange(query);
  return prisma.$transaction(
    async (db) => {
      const [members, enrollments, classes] = await loadMemberReportData(db, query, range);
      const rows = bucketRanges(query).map((bucket) => {
        const scheduled = classes.filter((c) => c.sessions.some((s) => inside(s.startAt, bucket)));
        const capacity = scheduled.reduce((sum, c) => sum + c.capacity, 0);
        const booked = scheduled.reduce(
          (sum, c) =>
            sum +
            c.enrollments.filter(
              (e) =>
                e.enrolledAt < bucket.end &&
                (!e.cancelledAt || e.cancelledAt > bucket.start) &&
                e.status !== Enums.EnrollmentStatus.PENDING_PAYMENT,
            ).length,
          0,
        );
        return {
          date: bucket.key,
          newMembers: members.filter((m) => periodKey(m.createdAt, query.groupBy) === bucket.key)
            .length,
          activeCourses: scheduled.length,
          newEnrollments: enrollments.filter((e) => inside(e.enrolledAt, bucket)).length,
          cancelledEnrollments: enrollments.filter((e) => inside(e.cancelledAt, bucket)).length,
          classCount: scheduled.length,
          seats: capacity,
          booked,
          occupancyPercent: capacity ? (booked / capacity) * PERCENT : 0,
        };
      });
      return { filters: { ...query, groupBy: query.groupBy ?? 'day' }, rows };
    },
    { isolationLevel: Enums.TransactionIsolationLevel.RepeatableRead },
  );
};
