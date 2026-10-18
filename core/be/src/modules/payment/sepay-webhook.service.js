import { SETTING_KEYS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { PRISMA_ERROR, SEPAY } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { buildWebhookNotices } from '../reconciliation/payment-notices.js';
import { sendNotices } from '../reconciliation/payment-notify.service.js';
import {
  openCase,
  openOrRefreshOverpaidCase,
  openOrRefreshTopupCase,
} from '../reconciliation/reconciliation-case.service.js';
import { applyTransfer, lockInvoice, PAYMENT_OUTCOME } from './payment-apply.service.js';

const { ReconciliationReason: REASON, WebhookLogStatus: LOG } = Enums;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Mã hoá đơn: ưu tiên trường `code` SePay đã nhận diện, nếu trống thì tìm trong nội dung chuyển khoản
 * (ngân hàng hay chèn thêm chữ/khoảng trắng quanh nội dung). BR-PAY-02.
 */
export const extractInvoiceCode = ({ code, content }, prefix) => {
  if (code) return code.trim().toUpperCase();
  const match = new RegExp(`${escapeRegex(prefix)}\\d+`, 'i').exec(content ?? '');
  return match?.[0]?.toUpperCase() ?? null;
};

const writeLog = (tx, payload, { status, reason, invoiceCode, invoiceId }) =>
  tx.paymentWebhookLog.create({
    data: {
      providerTransactionId: payload.id,
      invoiceCode,
      transferType: payload.transferType,
      transferAmount: Math.round(payload.transferAmount),
      status,
      reason,
      payload,
      invoiceId,
    },
  });

/** Lý do không tự ghi nhận được; null nghĩa là hoá đơn đang chờ và nhận tiền được. */
const classify = (invoice) => {
  if (invoice.channel !== Enums.InvoiceChannel.ONLINE)
    return { reason: REASON.NO_MATCH, note: 'Hoá đơn không thuộc kênh online' };
  if (invoice.status === Enums.InvoiceStatus.PAID)
    return { reason: REASON.DUPLICATE_TRANSFER, note: 'Hoá đơn đã thanh toán, nhận thêm tiền' };
  if (invoice.status !== Enums.InvoiceStatus.PENDING)
    return { reason: REASON.LATE, note: `Hoá đơn đã ${invoice.status}, tiền về muộn` };
  return null;
};

/** Ghi log NEEDS_REVIEW và mở phiếu đối soát với lý do tương ứng. */
const toReview = async (tx, payload, { invoiceCode, invoice, reason, note }) => {
  const log = await writeLog(tx, payload, {
    invoiceCode,
    invoiceId: invoice?.id,
    status: LOG.NEEDS_REVIEW,
    reason: note,
  });
  const kase = await openCase(tx, {
    reason,
    webhookLogId: log.id,
    invoiceId: invoice?.id,
    userId: invoice?.userId,
    amount: log.transferAmount,
    note,
  });
  return { log, kase, invoice };
};

const handleTransfer = async (tx, payload, invoiceCode, invoice) => {
  const result = await applyTransfer(tx, invoice, {
    amount: Math.round(payload.transferAmount),
    provider: Enums.PaymentProvider.SEPAY,
    reference: payload.referenceCode ?? payload.id,
    meta: { sepayId: payload.id },
  });
  const settled = result.outcome === PAYMENT_OUTCOME.PAID;
  const log = await writeLog(tx, payload, {
    invoiceCode,
    invoiceId: invoice.id,
    status: settled ? LOG.PROCESSED : LOG.NEEDS_REVIEW,
    reason: settled ? null : `${result.outcome}: đã nhận ${result.received}/${invoice.amount}`,
  });
  let kase = null;
  if (result.outcome === PAYMENT_OUTCOME.UNDERPAID) {
    kase = await openOrRefreshTopupCase(tx, invoice, log);
  } else if (result.outcome === PAYMENT_OUTCOME.OVERPAID) {
    kase = await openOrRefreshOverpaidCase(tx, invoice, log, result.excess);
  }
  return { log, kase, invoice, result };
};

const handle = async (tx, payload, invoiceCode) => {
  const invoice = invoiceCode ? await lockInvoice(tx, { code: invoiceCode }) : null;
  if (!invoice) {
    const note = invoiceCode
      ? `Không có hoá đơn mã ${invoiceCode}`
      : 'Nội dung chuyển khoản không có mã hoá đơn';
    return toReview(tx, payload, { invoiceCode, reason: REASON.NO_MATCH, note });
  }
  const rejection = classify(invoice);
  if (rejection) return toReview(tx, payload, { invoiceCode, invoice, ...rejection });
  const member = await tx.user.findUniqueOrThrow({ where: { id: invoice.userId } });
  if (member.status !== Enums.UserStatus.ACTIVE) {
    const note = 'Tài khoản hội viên đã bị khoá';
    return toReview(tx, payload, { invoiceCode, invoice, reason: REASON.NO_MATCH, note });
  }
  return handleTransfer(tx, payload, invoiceCode, invoice);
};

const logIgnored = (payload) =>
  prisma.paymentWebhookLog.create({
    data: {
      providerTransactionId: payload.id,
      transferType: payload.transferType,
      transferAmount: Math.round(payload.transferAmount),
      status: LOG.IGNORED,
      reason: 'Giao dịch tiền ra',
      payload,
    },
  });

/**
 * Xử lý webhook SePay. Luôn trả kết quả (không throw nghiệp vụ) để SePay không gửi lại vô hạn;
 * trường hợp không tự khớp được mở phiếu đối soát. Idempotent theo `id` giao dịch (BR-PAY-04).
 * Thông báo gửi sau commit nên lỗi gửi không làm mất giao dịch (BR-PAY-09).
 * @param {{ id: string, transferType: string, transferAmount: number, code?: string|null, content?: string|null, referenceCode?: string|null }} payload
 * @returns {Promise<{ status: string, reason?: string, outcome?: string }>}
 */
export const processSepayWebhook = async (payload) => {
  const existing = await prisma.paymentWebhookLog.findUnique({
    where: { providerTransactionId: payload.id },
  });
  if (existing) return { status: LOG.DUPLICATE };
  if (payload.transferType !== SEPAY.TRANSFER_IN) {
    await logIgnored(payload);
    return { status: LOG.IGNORED };
  }
  const prefix = await settingService.getValue(SETTING_KEYS.INVOICE_CODE_PREFIX);
  try {
    const handled = await prisma.$transaction(
      (tx) => handle(tx, payload, extractInvoiceCode(payload, prefix)),
      { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
    );
    await sendNotices(buildWebhookNotices(handled));
    return {
      status: handled.log.status,
      reason: handled.kase?.reason,
      outcome: handled.result?.outcome,
    };
  } catch (err) {
    // Hai webhook cùng id đến song song: bên đến sau thua unique, coi như đã xử lý.
    if (err?.code === PRISMA_ERROR.UNIQUE_VIOLATION) return { status: LOG.DUPLICATE };
    throw err;
  }
};
