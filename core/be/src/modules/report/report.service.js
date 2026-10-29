import { loadFinanceEvents } from './report-finance.service.js';
import { buildBreakdown } from './report-breakdown.service.js';
import { assertReportRange, periodKey, periodKeys, previousRange } from './report-periods.js';
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

/** Quyền report.view được kiểm tra tại router; dữ liệu và export cùng builder này. */
export const dashboard = async (query) => {
  await assertReportRange(query);
  return prisma.$transaction(
    async (db) => {
      const [events, payment, memberships, sessions, enrollments] = await loadReportData(db, query);
      const revenue = summarizeEvents(events, query);
      const comparison = query.compare
        ? compareRevenue(
            revenue,
            summarizeEvents(
              await loadFinanceEvents(db, previousRange(query)),
              previousRange(query),
            ),
          )
        : null;
      return {
        filters: {
          from: query.from,
          to: query.to,
          groupBy: query.groupBy ?? 'day',
          compare: query.compare ?? null,
          planId: query.planId ?? null,
          memberId: query.memberId ?? null,
        },
        timeZone: TIME.VIETNAM_ZONE,
        ...revenue,
        comparison,
        breakdown: buildBreakdown(events),
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
};

function summarizeEvents(events, query) {
  const rows = new Map(
    periodKeys(query).map((date) => [
      date,
      { date, revenue: 0, refunded: 0, net: 0, paidCount: 0, refundCount: 0 },
    ]),
  );
  for (const event of events) {
    const row = rows.get(periodKey(event.date, query.groupBy));
    row.revenue += event.revenue;
    row.refunded += event.refunded;
    if (event.isRefund) row.refundCount += 1;
    else row.paidCount += 1;
    row.net = row.revenue - row.refunded;
  }
  const data = [...rows.values()];
  return {
    rows: data,
    revenue: sum(data, 'revenue'),
    refunded: sum(data, 'refunded'),
    net: sum(data, 'net'),
    paidCount: sum(data, 'paidCount'),
    refundCount: sum(data, 'refundCount'),
  };
}
function compareRevenue(current, previous) {
  const percent = (key) =>
    previous[key] === 0
      ? null
      : ((current[key] - previous[key]) / Math.abs(previous[key])) * PERCENT;
  return {
    previous: { revenue: previous.revenue, refunded: previous.refunded, net: previous.net },
    percent: { revenue: percent('revenue'), refunded: percent('refunded'), net: percent('net') },
  };
}
const PERCENT = 100;
