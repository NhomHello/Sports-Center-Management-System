import { Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';

const dayRange = (q) => ({
  gte: new Date(`${q.from}T00:00:00+07:00`),
  lt: new Date(new Date(`${q.to}T00:00:00+07:00`).getTime() + TIME.MS_PER_DAY),
});
const invoiceScope = (q) => ({
  ...(q.memberId && { userId: q.memberId }),
  ...(q.planId && { planId: q.planId }),
});

/** Đọc toàn bộ chỉ số trong transaction nhất quán. */
export const loadReportData = async (db, query) => {
  const range = dayRange(query);
  const scope = invoiceScope(query);
  const membershipScope = {
    ...scope,
    startDate: { lt: range.lt },
    endDate: { gte: range.gte },
  };
  const enrollmentScope = {
    ...(query.memberId && { memberId: query.memberId }),
    ...(query.planId && { member: { memberships: { some: membershipScope } } }),
  };
  return Promise.all([
    db.invoice.findMany({
      where: {
        ...scope,
        status: { in: [Enums.InvoiceStatus.PAID, Enums.InvoiceStatus.REFUNDED] },
        paidAt: range,
      },
      select: { amount: true, paidAt: true },
    }),
    db.refund.findMany({
      where: {
        status: Enums.RefundStatus.DONE,
        completedAt: range,
        invoice: { ...scope, paidAt: { not: null } },
        // Hoàn phần thừa không làm giảm doanh thu bán gói, chỉ hoàn invoice mới giảm.
        caseId: null,
      },
      select: { amount: true, completedAt: true },
    }),
    db.payment.aggregate({
      where: { paidAt: range, invoice: scope },
      _count: true,
      _sum: { receivedAmount: true },
    }),
    db.membership.findMany({
      where: membershipScope,
      select: { status: true, freezes: { where: { endedAt: null } } },
    }),
    db.classSession.findMany({
      where: {
        startAt: range,
        ...((query.memberId || query.planId) && {
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
