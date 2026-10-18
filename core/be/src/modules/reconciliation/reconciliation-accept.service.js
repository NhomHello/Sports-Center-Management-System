import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { lockInvoice, settleInvoice, sumReceived } from '../payment/payment-apply.service.js';
import { fmtMoney, sendNotices, toMember } from './payment-notify.service.js';
import {
  assertContacted,
  assertNotRefunded,
  lockCase,
  updateCase,
} from './reconciliation-case.service.js';

const TX = { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted };

/**
 * BR-PAY-06/17: hoá đơn chuyển thừa không tự PAID. Sau khi liên hệ hội viên, quản lý chấp nhận
 * hoá đơn: PAID và kích hoạt gói; phiếu vẫn mở để hoàn phần thừa hoặc dùng cho lần gia hạn sau.
 * @param {number} id phiếu đối soát OVERPAID
 * @param {{ id: number }} actor
 */
export const acceptOverpaidCase = async (id, actor) => {
  const out = await prisma.$transaction(async (tx) => {
    const kase = await lockCase(tx, id);
    if (kase.reason !== Enums.ReconciliationReason.OVERPAID || !kase.invoiceId)
      throw ApiError.businessRule('Chỉ chấp nhận hoá đơn của phiếu chuyển thừa');
    assertContacted(kase);
    await assertNotRefunded(tx, kase);
    const invoice = await lockInvoice(tx, { id: kase.invoiceId });
    if (invoice.status !== Enums.InvoiceStatus.PENDING)
      throw ApiError.conflict('Hoá đơn đã được xử lý, vui lòng tải lại');
    const received = await sumReceived(tx, invoice.id);
    if (received < invoice.amount) throw ApiError.businessRule('Hoá đơn chưa nhận đủ tiền');
    const excess = received - invoice.amount;
    await settleInvoice(tx, invoice, {
      actorId: actor.id,
      meta: { caseId: kase.id, action: 'ACCEPT_OVERPAID', received, excess },
    });
    const updated = await updateCase(tx, kase, {
      data: { excessAmount: excess, note: `Đã chấp nhận hoá đơn, còn thừa ${excess}` },
      actor,
      action: 'ACCEPT_INVOICE',
    });
    return { kase: updated, invoice, excess };
  }, TX);
  await sendNotices([
    toMember({
      userId: out.invoice.userId,
      kind: Enums.NotificationKind.PAYMENT_CONFIRMED,
      eventKey: `case:${id}:accept`,
      title: `Đã thanh toán hoá đơn ${out.invoice.code}`,
      message:
        `Gói ${out.invoice.planName ?? out.invoice.plan?.name} đã được kích hoạt. ` +
        `Phần chuyển thừa ${fmtMoney(out.excess)} sẽ được hoàn hoặc dùng cho lần gia hạn theo thoả thuận.`,
    }),
  ]);
  return out.kase;
};
