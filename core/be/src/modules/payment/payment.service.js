import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { INVOICE_INCLUDE } from './invoice.service.js';
import { applyTransfer, lockInvoice, sumReceived } from './payment-apply.service.js';

/**
 * Hoá đơn tại quầy: thu phần còn lại bằng tiền mặt (đủ giá gốc, trừ phần đã trả bằng số dư) qua
 * cùng hàm khớp tiền với webhook nên quyền lợi được trao trong cùng transaction (BR-PAY-14/3.2).
 */
const collectCounterInvoice = async (tx, invoice, actor) => {
  const received = await sumReceived(tx, invoice.id);
  await applyTransfer(tx, invoice, {
    amount: invoice.amount - received,
    provider: Enums.PaymentProvider.COUNTER,
    reference: invoice.code,
    actorId: actor.id,
    meta: { action: 'COUNTER_CASH' },
  });
};

/**
 * Hoá đơn online đã chuyển thiếu: hội viên có thể nộp phần còn thiếu bằng tiền mặt tại quầy.
 * Ghi qua đúng hàm khớp tiền của webhook để phiếu chờ chuyển bù được đóng cùng lúc (BR-PAY-15/16).
 */
const collectOnlineTopup = async (tx, invoice, actor) => {
  const received = await sumReceived(tx, invoice.id);
  if (received <= 0)
    throw ApiError.businessRule('Hoá đơn online chưa nhận tiền: hội viên quét QR để thanh toán');
  await applyTransfer(tx, invoice, {
    amount: invoice.amount - received,
    provider: Enums.PaymentProvider.COUNTER,
    reference: invoice.code,
    actorId: actor.id,
    meta: { action: 'COUNTER_TOPUP' },
  });
};

/**
 * Thu tiền mặt tại quầy: hoá đơn tại quầy thu đủ giá gốc; hoá đơn online đang chờ chuyển bù thu
 * đúng phần còn thiếu. Gói được kích hoạt trong cùng transaction.
 */
export const collectCash = async (invoiceId, actor) =>
  prisma.$transaction(
    async (tx) => {
      const invoice = await lockInvoice(tx, { id: invoiceId });
      if (!invoice) throw ApiError.notFound('Không tìm thấy hóa đơn');
      if (invoice.status === Enums.InvoiceStatus.PAID) return invoice;
      if (invoice.status !== Enums.InvoiceStatus.PENDING)
        throw ApiError.conflict('Hóa đơn không còn chờ thanh toán');
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${invoice.userId} FOR UPDATE`;
      const member = await tx.user.findUniqueOrThrow({ where: { id: invoice.userId } });
      if (member.status !== Enums.UserStatus.ACTIVE)
        throw ApiError.businessRule('Tài khoản hội viên đã bị khóa');
      if (invoice.channel === Enums.InvoiceChannel.COUNTER)
        await collectCounterInvoice(tx, invoice, actor);
      else await collectOnlineTopup(tx, invoice, actor);
      return tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: INVOICE_INCLUDE });
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
