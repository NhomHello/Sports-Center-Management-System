import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { addCredit } from '../credit/credit.service.js';
import { sumReceived } from '../payment/payment-apply.service.js';

/** Điều chuyển phần thừa qua sổ số dư; không ghi thành lần thu ngân hàng mới. */
export const allocateOverpaidCredit = async (tx, kase, { invoice, amount, actor }) => {
  if (!(amount > 0)) throw ApiError.businessRule('Phiếu không còn phần thừa để sử dụng');
  const source = await tx.invoice.findUniqueOrThrow({ where: { id: kase.invoiceId } });
  const available = (await sumReceived(tx, source.id)) - source.amount;
  if (available < amount)
    throw ApiError.conflict('Phần thừa đã được phân bổ hoặc hoàn, không thể sử dụng lại');
  const note = `Dùng phần chuyển thừa từ ${source.code} cho ${invoice.code}`;
  await tx.refund.create({
    data: {
      caseId: kase.id,
      invoiceId: source.id,
      amount,
      reason: note,
      status: Enums.RefundStatus.DONE,
      reference: 'CREDIT',
      requestedById: actor.id,
      completedById: actor.id,
      completedAt: new Date(),
    },
  });
  await addCredit(tx, {
    userId: kase.userId,
    amount,
    reason: Enums.CreditReason.ADJUSTMENT,
    invoiceId: source.id,
    actorId: actor.id,
    note,
  });
  const credit = await addCredit(tx, {
    userId: kase.userId,
    amount: -amount,
    reason: Enums.CreditReason.PAYMENT,
    invoiceId: invoice.id,
    actorId: actor.id,
    note,
  });
  return { provider: Enums.PaymentProvider.CREDIT, reference: `CREDIT-${credit.id}` };
};
