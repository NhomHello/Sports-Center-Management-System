import { loadFinanceEvents } from './report-finance.service.js';
import { Enums } from '../../config/db.js';
import { reportRange } from './report-periods.js';

const invoiceScope = (q) => ({
  ...(q.memberId && { userId: q.memberId }),
  ...(q.planId && { planId: q.planId }),
  ...(q.classId && { classId: q.classId }),
});

/** Đọc toàn bộ chỉ số trong transaction nhất quán. */
export const loadReportData = async (db, query) => {
  const range = reportRange(query);
  const scope = invoiceScope(query);
  const enrollmentScope = {
    ...(query.memberId && { memberId: query.memberId }),
    ...(query.classId && { classId: query.classId }),
  };
  return Promise.all([
    loadFinanceEvents(db, query),
    db.payment.aggregate({
      where: { paidAt: range, invoice: scope, provider: { not: Enums.PaymentProvider.CREDIT } },
      _count: true,
      _sum: { receivedAmount: true },
    }),
    db.classSession.findMany({
      where: {
        startAt: range,
        ...((query.memberId || query.classId) && {
          gymClass: { enrollments: { some: enrollmentScope } },
        }),
      },
      select: { classId: true, status: true },
    }),
    db.classEnrollment.count({
      where: {
        ...enrollmentScope,
        status: Enums.EnrollmentStatus.BOOKED,
        gymClass: { sessions: { some: { startAt: range } } },
      },
    }),
  ]);
};
