import { SETTING_KEYS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, PRISMA_ERROR, SEPAY } from '../../constants/index.js';
import { activatePaidInvoice } from '../membership/membership-invoice.service.js';
import * as settingService from '../setting/setting.service.js';
import { INVOICE_INCLUDE } from './invoice.service.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Mã hoá đơn: ưu tiên trường `code` SePay đã nhận diện, nếu trống thì tìm trong nội dung chuyển khoản
 * (ngân hàng hay chèn thêm chữ/khoảng trắng quanh nội dung).
 */
export const extractInvoiceCode = ({ code, content }, prefix) => {
  if (code) return code;
  const match = new RegExp(`${escapeRegex(prefix)}\\d+`, 'i').exec(content ?? '');
  return match?.[0] ?? null;
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

/** Lý do không tự xác nhận được; null nghĩa là hợp lệ để kích hoạt gói. */
const findRejection = async (tx, invoice, payload) => {
  if (invoice.channel !== Enums.InvoiceChannel.ONLINE) return 'Hoá đơn không thuộc kênh online';
  if (invoice.status === Enums.InvoiceStatus.PAID) {
    return 'Hoá đơn đã thanh toán trước đó, có thể chuyển khoản trùng';
  }
  if (invoice.status !== Enums.InvoiceStatus.PENDING) {
    return `Hoá đơn đã ${invoice.status}, tiền đã về nhưng chưa kích hoạt gói`;
  }
  if (payload.transferAmount !== invoice.amount) {
    return `Sai số tiền: nhận ${payload.transferAmount}, cần ${invoice.amount}`;
  }
  const member = await tx.user.findUniqueOrThrow({ where: { id: invoice.userId } });
  return member.status === Enums.UserStatus.ACTIVE ? null : 'Tài khoản hội viên đã bị khoá';
};

const settle = async (tx, invoice, payload) => {
  const paidAt = new Date();
  await tx.invoice.update({
    where: { id: invoice.id },
    data: { status: Enums.InvoiceStatus.PAID, paidAt },
  });
  const payment = await tx.payment.create({
    data: {
      invoiceId: invoice.id,
      provider: Enums.PaymentProvider.SEPAY,
      requestedAmount: invoice.amount,
      receivedAmount: payload.transferAmount,
      reference: payload.referenceCode ?? payload.id,
      paidAt,
    },
  });
  const membership = await activatePaidInvoice(invoice, paidAt, tx);
  await tx.auditLog.create({
    data: {
      action: AUDIT_ACTIONS.PAYMENT,
      entity: ENTITIES.INVOICE,
      entityId: String(invoice.id),
      meta: {
        before: { status: invoice.status },
        after: { status: Enums.InvoiceStatus.PAID },
        provider: Enums.PaymentProvider.SEPAY,
        paymentId: payment.id,
        membershipId: membership.id,
        sepayId: payload.id,
      },
    },
  });
};

const handle = async (tx, payload, invoiceCode) => {
  const base = { invoiceCode };
  if (!invoiceCode) {
    return writeLog(tx, payload, {
      ...base,
      status: Enums.WebhookLogStatus.NEEDS_REVIEW,
      reason: 'Nội dung chuyển khoản không có mã hoá đơn',
    });
  }
  const [locked] =
    await tx.$queryRaw`SELECT id FROM invoices WHERE code = ${invoiceCode} FOR UPDATE`;
  const invoice = locked
    ? await tx.invoice.findUnique({ where: { id: locked.id }, include: INVOICE_INCLUDE })
    : null;
  if (!invoice) {
    return writeLog(tx, payload, {
      ...base,
      status: Enums.WebhookLogStatus.NEEDS_REVIEW,
      reason: `Không có hoá đơn mã ${invoiceCode}`,
    });
  }
  const rejection = await findRejection(tx, invoice, payload);
  if (rejection) {
    return writeLog(tx, payload, {
      ...base,
      invoiceId: invoice.id,
      status: Enums.WebhookLogStatus.NEEDS_REVIEW,
      reason: rejection,
    });
  }
  await settle(tx, invoice, payload);
  return writeLog(tx, payload, {
    ...base,
    invoiceId: invoice.id,
    status: Enums.WebhookLogStatus.PROCESSED,
  });
};

/**
 * Xử lý webhook SePay. Luôn trả kết quả (không throw nghiệp vụ) để SePay không gửi lại vô hạn;
 * trường hợp không tự khớp được ghi NEEDS_REVIEW cho nhân viên xử lý. Idempotent theo `id` giao dịch.
 * @param {{ id: string, transferType: string, transferAmount: number, code?: string|null, content?: string|null, referenceCode?: string|null }} payload
 * @returns {Promise<{ status: string }>}
 */
export const processSepayWebhook = async (payload) => {
  const existing = await prisma.paymentWebhookLog.findUnique({
    where: { providerTransactionId: payload.id },
  });
  if (existing) return { status: Enums.WebhookLogStatus.DUPLICATE };
  if (payload.transferType !== SEPAY.TRANSFER_IN) {
    await prisma.paymentWebhookLog.create({
      data: {
        providerTransactionId: payload.id,
        transferType: payload.transferType,
        transferAmount: Math.round(payload.transferAmount),
        status: Enums.WebhookLogStatus.IGNORED,
        reason: 'Giao dịch tiền ra',
        payload,
      },
    });
    return { status: Enums.WebhookLogStatus.IGNORED };
  }
  const prefix = await settingService.getValue(SETTING_KEYS.INVOICE_CODE_PREFIX);
  try {
    const log = await prisma.$transaction(
      (tx) => handle(tx, payload, extractInvoiceCode(payload, prefix)),
      { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
    );
    return { status: log.status };
  } catch (err) {
    // Hai webhook cùng id đến song song: bên đến sau thua unique, coi như đã xử lý.
    if (err?.code === PRISMA_ERROR.UNIQUE_VIOLATION) {
      return { status: Enums.WebhookLogStatus.DUPLICATE };
    }
    throw err;
  }
};
