import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, ENTITIES, PAYMENT_LIMITS } from '../../constants/index.js';
import {
  fmtMoney,
  sendNotices,
  toMember,
  toReconcilers,
} from '../reconciliation/payment-notify.service.js';
import { releaseHoldsForInvoice } from '../course-order/course-hold.service.js';
import { restoreCreditPayments } from '../credit/credit.service.js';
import { lockInvoice, sumReceived } from './payment-apply.service.js';

const { ReconciliationStatus: STATUS, ReconciliationReason: REASON } = Enums;

/** BR-PAY-16: quá hạn chuyển bù thì phiếu thiếu tiền chờ Manager hoàn số đã nhận. */
const moveTopupCasesToRefund = (tx, invoiceId) =>
  tx.reconciliationCase.updateMany({
    where: { invoiceId, reason: REASON.UNDERPAID, status: STATUS.WAITING_TOPUP },
    data: { status: STATUS.REFUND_PENDING, note: 'Quá hạn chuyển bù, chờ hoàn số đã nhận' },
  });

/** Hết hạn một hoá đơn nếu vẫn còn PENDING khi đã khoá hàng (webhook về cùng lúc thì một bên thắng). */
const expireOne = (id, now) =>
  prisma.$transaction(
    async (tx) => {
      const invoice = await lockInvoice(tx, { id });
      if (invoice?.status !== Enums.InvoiceStatus.PENDING || invoice.expiresAt > now) return null;
      const received = await sumReceived(tx, id);
      // Đã nhận đủ hoặc thừa: tiền nằm ở trung tâm, chờ quản lý chấp nhận/hoàn, không tự huỷ.
      if (received >= invoice.amount) return null;
      await tx.invoice.update({ where: { id }, data: { status: Enums.InvoiceStatus.FAILED } });
      // Phần trả bằng số dư quay lại số dư; chỉ tiền chuyển khoản thật mới phải hoàn tay.
      const restored = await restoreCreditPayments(tx, invoice, null);
      await releaseHoldsForInvoice(tx, id);
      if (received - restored > 0) await moveTopupCasesToRefund(tx, id);
      await tx.auditLog.create({
        data: {
          action: AUDIT_ACTIONS.UPDATE,
          entity: ENTITIES.INVOICE,
          entityId: String(id),
          meta: {
            before: { status: Enums.InvoiceStatus.PENDING },
            after: { status: Enums.InvoiceStatus.FAILED },
            reason: received > 0 ? 'TOPUP_TIMEOUT' : 'PAYMENT_TIMEOUT',
            received,
            restoredCredit: restored,
          },
        },
      });
      return { invoice, received: received - restored };
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );

const expiryNotices = ({ invoice, received }) => {
  const member = toMember({
    userId: invoice.userId,
    kind: Enums.NotificationKind.INVOICE_EXPIRED,
    eventKey: `invoice:${invoice.id}:expired`,
    title: `Hoá đơn ${invoice.code} đã hết hạn`,
    message:
      received > 0
        ? `Trung tâm đã nhận ${fmtMoney(received)} nhưng chưa đủ; khoản này sẽ được hoàn lại cho bạn.`
        : 'Nếu bạn đã chuyển khoản, hãy bấm "Tôi đã chuyển khoản" trong lịch sử giao dịch.',
  });
  if (received === 0) return [member];
  return [
    member,
    toReconcilers({
      eventKey: `invoice:${invoice.id}:topup-timeout`,
      title: `Hoá đơn ${invoice.code} quá hạn chuyển bù`,
      message: `Đã nhận ${fmtMoney(received)}. Liên hệ hội viên và tạo yêu cầu hoàn tiền.`,
    }),
  ];
};

/**
 * UC-PAY-04: chuyển hoá đơn online quá hạn sang FAILED. Hoá đơn tại quầy không có hạn online nên
 * không bị đụng. Trả số hoá đơn đã hết hạn để test và log.
 * @param {Date} [now]
 */
export const expireOverdueInvoices = async (now = new Date()) => {
  const due = await prisma.invoice.findMany({
    where: {
      status: Enums.InvoiceStatus.PENDING,
      channel: Enums.InvoiceChannel.ONLINE,
      expiresAt: { lte: now },
    },
    select: { id: true },
    take: PAYMENT_LIMITS.EXPIRY_BATCH_SIZE,
  });
  let expired = 0;
  for (const { id } of due) {
    const done = await expireOne(id, now);
    if (!done) continue;
    expired += 1;
    await sendNotices(expiryNotices(done));
  }
  return expired;
};

/** Chạy job trong tiến trình BE như outbox lớp học; trả hàm dừng để tắt server gọn. */
export const startInvoiceExpiryWorker = () => {
  const tick = () =>
    expireOverdueInvoices().catch((err) => logger.error({ err }, 'Job hết hạn hoá đơn lỗi'));
  const timer = setInterval(tick, PAYMENT_LIMITS.EXPIRY_INTERVAL_MS);
  timer.unref();
  tick();
  return () => clearInterval(timer);
};
