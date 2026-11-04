import { Enums } from '../../config/db.js';
import { INVOICE_REFUND_WHERE } from '../payment/invoice.service.js';
import { sumReceived } from '../payment/payment-apply.service.js';
import { ACTIVE_STATUSES, updateCase } from './reconciliation-case.service.js';

/** Chỉ khép phiếu dùng tiền trong Payment khi tiền đã thực sự được hoàn hết, không còn lệnh chờ. */
export const closeRefundedInvoiceCases = async (tx, refund, actor) => {
  if (!refund.invoiceId) return;
  const appliedRefund = await tx.refund.count({
    where: { id: refund.id, ...INVOICE_REFUND_WHERE },
  });
  if (!appliedRefund) return;
  const [pending, remaining] = await Promise.all([
    tx.refund.count({
      where: {
        invoiceId: refund.invoiceId,
        status: Enums.RefundStatus.PENDING,
        ...INVOICE_REFUND_WHERE,
      },
    }),
    sumReceived(tx, refund.invoiceId),
  ]);
  if (pending || remaining > 0) return;
  const cases = await tx.reconciliationCase.findMany({
    where: {
      invoiceId: refund.invoiceId,
      reason: { in: [Enums.ReconciliationReason.UNDERPAID, Enums.ReconciliationReason.OVERPAID] },
      status: { in: ACTIVE_STATUSES },
    },
  });
  for (const kase of cases) {
    await updateCase(tx, kase, {
      data: {
        status: Enums.ReconciliationStatus.REFUNDED,
        note: `Tiền đã ghi vào hóa đơn được hoàn đầy đủ; kết thúc tại yêu cầu hoàn #${refund.id}`,
      },
      actor,
      action: 'INVOICE_FUNDS_REFUNDED',
    });
  }
};

/** Hết hạn khóa đã trả bằng số dư: số dư trả lại xong cũng khép phiếu tiền nếu không còn khoản bank. */
export const closeRestoredCreditCases = async (tx, invoice) => {
  const refund = await tx.refund.findFirst({
    where: { invoiceId: invoice.id, status: Enums.RefundStatus.DONE, reference: 'CREDIT' },
    orderBy: { id: 'desc' },
  });
  if (refund) await closeRefundedInvoiceCases(tx, refund, { id: invoice.userId });
};
