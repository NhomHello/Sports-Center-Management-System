import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { activatePaidInvoice } from '../membership/membership.service.js';
import { INVOICE_INCLUDE } from './invoice.service.js';

/** BR-PAY-14/3.2: đúng giá gốc; chuyển PAID, thu tiền và kích hoạt cùng transaction. */
export const collectCash = async (invoiceId, actor) =>
  prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: INVOICE_INCLUDE,
      });
      if (!invoice) throw ApiError.notFound('Không tìm thấy hóa đơn');
      if (invoice.channel !== Enums.InvoiceChannel.COUNTER)
        throw ApiError.businessRule('Chỉ thu tiền mặt cho hóa đơn tại quầy');
      if (invoice.status === Enums.InvoiceStatus.PAID) return invoice;
      if (invoice.status !== Enums.InvoiceStatus.PENDING)
        throw ApiError.conflict('Hóa đơn không còn chờ thanh toán');
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${invoice.userId} FOR UPDATE`;
      const member = await tx.user.findUniqueOrThrow({ where: { id: invoice.userId } });
      if (member.status !== Enums.UserStatus.ACTIVE)
        throw ApiError.businessRule('Tài khoản hội viên đã bị khóa');
      const paidAt = new Date();
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: Enums.InvoiceStatus.PAID, paidAt },
      });
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          provider: Enums.PaymentProvider.COUNTER,
          requestedAmount: invoice.amount,
          receivedAmount: invoice.amount,
          paidAt,
          actorId: actor.id,
          reference: invoice.code,
        },
      });
      const membership = await activatePaidInvoice(invoice, paidAt, tx);
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: AUDIT_ACTIONS.UPDATE,
          entity: ENTITIES.INVOICE,
          entityId: String(invoiceId),
          meta: {
            before: { status: invoice.status },
            after: { status: Enums.InvoiceStatus.PAID },
            paymentId: payment.id,
            membershipId: membership.id,
            amount: invoice.amount,
          },
        },
      });
      return tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: INVOICE_INCLUDE });
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
