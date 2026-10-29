import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { addCredit } from '../credit/credit.service.js';

const fmt = (value) => `${value.toLocaleString('vi-VN')} đ`;

/**
 * Trả phần tiền của một lần hủy/đổi cho hội viên: REFUND tạo yêu cầu hoàn để quản lý chuyển trả
 * (luồng hoàn tiền hiện có), CREDIT cộng ngay vào số dư. Ghi liên kết vào PurchaseChange.
 * @param {object} db transaction client
 * @param {{ change: object, amount: number, settlement: string, actor: { id: number }, reason: string }} input
 */
export const payOut = async (db, { change, amount, settlement, actor, reason }) => {
  if (amount <= 0) return change;
  if (settlement === Enums.SettlementMode.REFUND) {
    const refund = await db.refund.create({
      data: { invoiceId: change.fromInvoiceId, amount, reason, requestedById: actor.id },
    });
    await db.notification.create({
      data: {
        userId: change.userId,
        kind: Enums.NotificationKind.PAYMENT_REFUND,
        title: `Trung tâm sẽ hoàn ${fmt(amount)} cho bạn`,
        message: `${reason}. Bạn sẽ nhận thông báo khi chuyển trả xong.`,
        dedupeKey: `purchase-change-refund:${change.id}`,
      },
    });
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
