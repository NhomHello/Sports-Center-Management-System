import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { applyTransfer, lockInvoice, sumReceived } from '../payment/payment-apply.service.js';
import { INVOICE_INCLUDE } from '../payment/invoice.service.js';
import { addCredit } from './credit.service.js';

/** Chủ hoá đơn hoặc nhân viên thu tiền / xem mọi giao dịch mới được dùng số dư cho hoá đơn. */
const assertCanPay = (invoice, context) => {
  const staff =
    context.permissions.has(P.PAYMENT_RECORD_CASH) || context.permissions.has(P.PAYMENT_READ_ALL);
  if (invoice.userId !== context.user.id && !staff) throw ApiError.forbidden();
};

/**
 * GY-33: trừ số dư vào hoá đơn đang chờ thanh toán (mặc định dùng tối đa có thể). Khoản trừ đi
 * qua applyTransfer (provider CREDIT) nên đủ tiền thì quyền lợi được trao ngay, thiếu thì phần
 * còn lại trả bằng QR / tiền mặt như hoá đơn thường.
 * @param {number} invoiceId
 * @param {{ amount?: number }} input
 * @param {{ user: { id: number }, permissions: Set<string> }} context
 */
export const applyCredit = (invoiceId, { amount }, context) =>
  prisma.$transaction(
    async (tx) => {
      const invoice = await lockInvoice(tx, { id: invoiceId });
      if (!invoice) throw ApiError.notFound('Không tìm thấy hoá đơn');
      assertCanPay(invoice, context);
      if (invoice.status !== Enums.InvoiceStatus.PENDING)
        throw ApiError.conflict('Hoá đơn không còn chờ thanh toán');
      const due = invoice.amount - (await sumReceived(tx, invoice.id));
      const member = await tx.user.findUniqueOrThrow({ where: { id: invoice.userId } });
      const value = Math.min(amount ?? member.creditBalance, member.creditBalance, due);
      if (due <= 0) throw ApiError.businessRule('Hoá đơn đã nhận đủ tiền');
      if (value <= 0) throw ApiError.businessRule('Số dư tài khoản không đủ');
      const credit = await addCredit(tx, {
        userId: invoice.userId,
        amount: -value,
        reason: Enums.CreditReason.PAYMENT,
        invoiceId: invoice.id,
        note: `Thanh toán hoá đơn ${invoice.code}`,
        actorId: context.user.id,
      });
      const result = await applyTransfer(tx, invoice, {
        amount: value,
        provider: Enums.PaymentProvider.CREDIT,
        reference: `CREDIT-${credit.id}`,
        actorId: context.user.id,
        meta: { action: 'APPLY_CREDIT', creditId: credit.id },
      });
      const updated = await tx.invoice.findUniqueOrThrow({
        where: { id: invoice.id },
        include: INVOICE_INCLUDE,
      });
      return { ...updated, creditApplied: value, outcome: result.outcome, missing: result.missing };
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
