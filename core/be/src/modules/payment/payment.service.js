import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { settleCounterInvoice } from './settlement.service.js';

/** Thu tiền mặt đúng giá gói và hoàn tất toàn bộ giao dịch tại quầy. */
export const collectCash = async (invoiceId, data, actor) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { plan: true },
  });
  if (!invoice || invoice.channel !== Enums.InvoiceChannel.COUNTER) {
    throw ApiError.notFound('Không tìm thấy hoá đơn tại quầy');
  }
  const result = await prisma.$transaction((tx) =>
    settleCounterInvoice({ invoice, ...data, actorId: actor.id, tx }),
  );
  await recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.PAYMENT,
    entity: ENTITIES.INVOICE,
    entityId: invoice.id,
    meta: {
      requestedAmount: invoice.amount,
      receivedAmount: data.receivedAmount,
      paymentId: result.payment.id,
    },
  });
  return result;
};
