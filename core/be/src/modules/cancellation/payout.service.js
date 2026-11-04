import { notifyRefundRequested } from '../reconciliation/refund-notification.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { addCredit } from '../credit/credit.service.js';

/**
 * Trả phần tiền của một lần hủy/đổi cho hội viên: REFUND tạo yêu cầu hoàn để quản lý chuyển trả
 * (luồng hoàn tiền hiện có), CREDIT cộng ngay vào số dư. Ghi liên kết vào PurchaseChange.
 * @param {object} db transaction client
 * @param {{ change: object, amount: number, settlement: string, actor: { id: number }, reason: string }} input
 */
export const payOut = async (db, { change, amount, settlement, actor, reason }) => {
  if (amount <= 0) return change;
  if (
    [Enums.PurchaseChangeKind.CANCEL_COURSE, Enums.PurchaseChangeKind.CHANGE_CLASS].includes(
      change.kind,
    ) &&
    settlement !== Enums.SettlementMode.REFUND
  )
    throw ApiError.businessRule(
      'Hoàn tiền khóa học được chuyển trả qua admin, không ghi vào ví/số dư',
    );
  if (settlement === Enums.SettlementMode.REFUND) {
    const refund = await db.refund.create({
      data: { invoiceId: change.fromInvoiceId, amount, reason, requestedById: actor.id },
    });
    await notifyRefundRequested(db, refund, { userId: change.userId, reason });
    return db.purchaseChange.update({ where: { id: change.id }, data: { refundId: refund.id } });
  }
  if (settlement === Enums.SettlementMode.CREDIT) {
    const credit = await addCredit(db, {
      userId: change.userId,
      amount,
      reason: change.kind.startsWith('CANCEL')
        ? Enums.CreditReason.CANCELLATION
        : Enums.CreditReason.CHANGE,
      changeId: change.id,
      invoiceId: change.fromInvoiceId,
      note: reason,
      actorId: actor.id,
    });
    return db.purchaseChange.update({
      where: { id: change.id },
      data: { creditTransactionId: credit.id },
    });
  }
  throw ApiError.businessRule('Hãy chọn nhận tiền hoàn hoặc ghi vào số dư');
};
