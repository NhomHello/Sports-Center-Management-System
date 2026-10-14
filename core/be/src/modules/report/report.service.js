import { loadReportData } from './report-query.service.js';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { vietnamDate } from '../../common/utils/vietnam-date.js';

const sum = (items, field) => items.reduce((total, item) => total + item[field], 0);
/** Cùng dữ liệu và công thức cho dashboard/export; ngày thu và ngày hoàn là hai sự kiện riêng. */
export const buildRevenue = (invoices, refunds) => {
  const days = new Map();
  const get = (date) => {
    const day = vietnamDate(date);
    if (!days.has(day))
      days.set(day, { date: day, revenue: 0, refunded: 0, net: 0, paidCount: 0, refundCount: 0 });
    return days.get(day);
  };
  for (const invoice of invoices) {
    const row = get(invoice.paidAt);
    row.revenue += invoice.amount;
    row.paidCount += 1;
  }
  for (const refund of refunds) {
    const row = get(refund.completedAt);
    row.refunded += refund.amount;
    row.refundCount += 1;
  }
  const rows = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, net: row.revenue - row.refunded }));
  return {
    rows,
    revenue: sum(invoices, 'amount'),
    refunded: sum(refunds, 'amount'),
    net: sum(invoices, 'amount') - sum(refunds, 'amount'),
    paidCount: invoices.length,
    refundCount: refunds.length,
  };
};

/** report.view cho toàn trung tâm; memberId/planId cùng phạm vi cho thu, hoàn, gói và lớp. */
export const dashboard = (query) =>
  prisma.$transaction(
    async (db) => {
      const [invoices, refunds, payment, memberships, sessions, enrollments] = await loadReportData(
        db,
        query,
      );
      const revenue = buildRevenue(invoices, refunds);
      return {
        filters: {
          from: query.from,
          to: query.to,
          planId: query.planId ?? null,
          memberId: query.memberId ?? null,
        },
        timeZone: TIME.VIETNAM_ZONE,
        ...revenue,
        payment: { count: payment._count, receivedAmount: payment._sum.receivedAmount ?? 0 },
        membership: {
          total: memberships.length,
          active: memberships.filter((m) => m.status === Enums.MembershipStatus.ACTIVE).length,
          expired: memberships.filter((m) => m.status === Enums.MembershipStatus.EXPIRED).length,
        },
        classes: {
          total: new Set(sessions.map((s) => s.classId)).size,
          sessions: sessions.length,
          cancelledSessions: sessions.filter((s) => s.status === Enums.SessionStatus.CANCELLED)
            .length,
          enrollments,
        },
      };
    },
    { isolationLevel: Enums.TransactionIsolationLevel.RepeatableRead },
  );
