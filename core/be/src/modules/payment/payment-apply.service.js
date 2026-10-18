import { SETTING_KEYS } from '@scms/shared';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, TIME } from '../../constants/index.js';
import { activatePaidInvoice } from '../membership/membership-invoice.service.js';
import * as settingService from '../setting/setting.service.js';
import { INVOICE_INCLUDE, INVOICE_REFUND_WHERE } from './invoice.service.js';

export const PAYMENT_OUTCOME = Object.freeze({
  PAID: 'PAID',
  UNDERPAID: 'UNDERPAID',
  OVERPAID: 'OVERPAID',
});

const OPEN_STATUSES = [
  Enums.ReconciliationStatus.OPEN,
  Enums.ReconciliationStatus.WAITING_MEMBER,
  Enums.ReconciliationStatus.WAITING_TOPUP,
];

/** Khoá hàng hoá đơn (FOR UPDATE) rồi đọc lại bản đầy đủ; null nếu không có. */
export const lockInvoice = async (tx, { id, code }) => {
  const [row] = id
    ? await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${id} FOR UPDATE`
    : await tx.$queryRaw`SELECT id FROM invoices WHERE code = ${code} FOR UPDATE`;
  return row ? tx.invoice.findUnique({ where: { id: row.id }, include: INVOICE_INCLUDE }) : null;
};

/** BR-PAY-16: số đã nhận của hoá đơn là tổng các payment (kể cả chuyển bù) trừ phần đã hoàn. */
export const sumReceived = async (tx, invoiceId) => {
  const [{ _sum: paid }, { _sum: refunded }] = await Promise.all([
    tx.payment.aggregate({ where: { invoiceId }, _sum: { receivedAmount: true } }),
    tx.refund.aggregate({ where: { invoiceId, ...INVOICE_REFUND_WHERE }, _sum: { amount: true } }),
  ]);
  return (paid.receivedAmount ?? 0) - (refunded.amount ?? 0);
};

/** Đủ tiền thì phiếu chờ chuyển bù / phiếu "đã chuyển khoản" của hoá đơn được đóng cùng lúc. */
const closeSettledCases = async (tx, invoiceId, actorId, now) => {
  const cases = await tx.reconciliationCase.findMany({
    where: {
      invoiceId,
      reason: {
        in: [Enums.ReconciliationReason.UNDERPAID, Enums.ReconciliationReason.MEMBER_CLAIM],
      },
      // Phiếu bị job chuyển "chờ hoàn" khi quá hạn chuyển bù nhưng chưa tạo lệnh hoàn: tiền bù về
      // muộn làm hoá đơn đủ tiền thì phiếu đó cũng đóng, tránh hoàn nhầm toàn bộ số đã nhận.
      OR: [
        { status: { in: OPEN_STATUSES } },
        { status: Enums.ReconciliationStatus.REFUND_PENDING, refunds: { none: {} } },
      ],
    },
    select: { id: true, webhookLogId: true },
  });
  if (cases.length === 0) return;
  await tx.reconciliationCase.updateMany({
    where: { id: { in: cases.map((item) => item.id) } },
    data: { status: Enums.ReconciliationStatus.MATCHED, resolvedAt: now, resolvedById: actorId },
  });
  const logIds = cases.map((item) => item.webhookLogId).filter(Boolean);
  if (logIds.length) {
    await tx.paymentWebhookLog.updateMany({
      where: { id: { in: logIds } },
      data: { status: Enums.WebhookLogStatus.RESOLVED, reviewedById: actorId, reviewedAt: now },
    });
  }
};

const writeAudit = (tx, invoice, actorId, meta) =>
  tx.auditLog.create({
    data: {
      userId: actorId,
      action: AUDIT_ACTIONS.PAYMENT,
      entity: ENTITIES.INVOICE,
      entityId: String(invoice.id),
      meta: { before: { status: invoice.status }, ...meta },
    },
  });

/**
 * Ghi nhận một khoản tiền vào hoá đơn (webhook, map thủ công, gia hạn từ tiền thừa đều dùng hàm này).
 * Thiếu: hoá đơn giữ/chuyển về PENDING với hạn chuyển bù mới. Đủ hoặc thừa: PAID và kích hoạt gói
 * theo BR-1.3/1.4. Phải gọi trong transaction sau khi đã khoá hoá đơn bằng lockInvoice.
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {object} invoice hoá đơn đã khoá, có include plan
 * @param {{ amount: number, provider: string, reference?: string|null, actorId?: number|null, meta?: object }} input
 * @returns {Promise<{ outcome: string, received: number, missing: number, excess: number, expiresAt?: Date }>}
 */
export const applyTransfer = async (tx, invoice, input) => {
  const { amount, provider, reference = null, actorId = null, meta = {} } = input;
  const now = new Date();
  const received = (await sumReceived(tx, invoice.id)) + amount;
  const payment = await tx.payment.create({
    data: {
      invoiceId: invoice.id,
      provider,
      requestedAmount: invoice.amount,
      receivedAmount: amount,
      reference,
      paidAt: now,
      actorId,
    },
  });
  const base = { ...meta, provider, amount, received, paymentId: payment.id };
  if (received < invoice.amount) {
    const hours = await settingService.getValue(SETTING_KEYS.PAYMENT_TOPUP_DEADLINE_HOURS);
    const expiresAt = new Date(now.getTime() + hours * TIME.MS_PER_HOUR);
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: Enums.InvoiceStatus.PENDING, expiresAt },
    });
    await writeAudit(tx, invoice, actorId, { ...base, outcome: PAYMENT_OUTCOME.UNDERPAID });
    const missing = invoice.amount - received;
    return { outcome: PAYMENT_OUTCOME.UNDERPAID, received, missing, excess: 0, expiresAt };
  }
  await tx.invoice.update({
    where: { id: invoice.id },
    data: { status: Enums.InvoiceStatus.PAID, paidAt: now },
  });
  const membership = await activatePaidInvoice(invoice, now, tx);
  await closeSettledCases(tx, invoice.id, actorId, now);
  const excess = received - invoice.amount;
  const outcome = excess > 0 ? PAYMENT_OUTCOME.OVERPAID : PAYMENT_OUTCOME.PAID;
  await writeAudit(tx, invoice, actorId, {
    ...base,
    outcome,
    after: { status: Enums.InvoiceStatus.PAID },
    membershipId: membership.id,
  });
  return { outcome, received, missing: 0, excess };
};
