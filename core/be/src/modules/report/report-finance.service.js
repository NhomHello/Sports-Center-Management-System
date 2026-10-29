import { Enums } from '../../config/db.js';
import { reportRange } from './report-periods.js';

const scopeFor = (query) => ({
  ...(query.memberId && { userId: query.memberId }),
  ...(query.planId && { planId: query.planId }),
});
const details = {
  payments: { where: { provider: Enums.PaymentProvider.CREDIT }, select: { receivedAmount: true } },
  plan: { select: { id: true, name: true } },
  courseClass: { select: { id: true, name: true, subject: { select: { id: true, name: true } } } },
};
const cashValue = (invoice) =>
  Math.max(0, invoice.amount - invoice.payments.reduce((sum, p) => sum + p.receivedAmount, 0));

/** BR-S4-12/15: sự kiện thu/hoàn mang cùng chiều phân loại; không tính lại CREDIT. */
export const loadFinanceEvents = async (db, query) => {
  const range = reportRange(query);
  const scope = scopeFor(query);
  const [invoices, refunds] = await Promise.all([
    db.invoice.findMany({
      where: {
        ...scope,
        status: { in: [Enums.InvoiceStatus.PAID, Enums.InvoiceStatus.REFUNDED] },
        paidAt: range,
      },
      include: details,
    }),
    db.refund.findMany({
      where: {
        status: Enums.RefundStatus.DONE,
        completedAt: range,
        caseId: null,
        invoice: { ...scope, paidAt: { not: null } },
      },
      include: {
        invoice: {
          include: {
            ...details,
            refunds: {
              where: {
                status: Enums.RefundStatus.DONE,
                caseId: null,
                completedAt: { lt: range.lt },
              },
              orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
            },
          },
        },
      },
    }),
  ]);
  const collected = invoices.map((invoice) => ({
    invoice,
    date: invoice.paidAt,
    revenue: cashValue(invoice),
    refunded: 0,
    isRefund: false,
  }));
  const returned = refunds.map(toRefundEvent);
  return [...collected, ...returned];
};

function toRefundEvent(refund) {
  const earlier = refund.invoice.refunds
    .filter(
      (r) =>
        r.completedAt < refund.completedAt ||
        (r.completedAt.getTime() === refund.completedAt.getTime() && r.id < refund.id),
    )
    .reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(0, cashValue(refund.invoice) - earlier);
  return {
    invoice: refund.invoice,
    date: refund.completedAt,
    revenue: 0,
    refunded: Math.min(refund.amount, remaining),
    isRefund: true,
  };
}
