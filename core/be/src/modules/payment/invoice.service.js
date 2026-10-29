import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { buildPaymentInstruction } from './sepay-qr.service.js';

/**
 * Khoản hoàn trừ vào tiền đã ghi của hoá đơn: hoàn cả hoá đơn, hoặc hoàn từ phiếu thiếu/thừa tiền
 * (tiền của các phiếu này đã nằm trong payment). Hoàn khoản chuyển lặp/sai mã/về muộn không trừ vì
 * khoản đó chưa bao giờ được ghi vào hoá đơn.
 */
export const INVOICE_REFUND_WHERE = Object.freeze({
  OR: [
    { caseId: null },
    {
      case: {
        reason: {
          in: [Enums.ReconciliationReason.UNDERPAID, Enums.ReconciliationReason.OVERPAID],
        },
      },
    },
  ],
});

/** Quan hệ được phép xem; thông tin người thu không bao gồm credential. */
export const INVOICE_INCLUDE = {
  plan: true,
  membership: { include: { plan: true } },
  payments: { orderBy: { paidAt: 'desc' } },
  refunds: {
    where: INVOICE_REFUND_WHERE,
    select: { id: true, amount: true, status: true, createdAt: true },
  },
  // Phiếu "Tôi đã chuyển khoản" mới nhất để hội viên thấy đang chờ kiểm tra hay đã bị từ chối.
  cases: {
    where: { reason: Enums.ReconciliationReason.MEMBER_CLAIM },
    select: { id: true, status: true, note: true, createdAt: true },
    orderBy: { id: 'desc' },
    take: 1,
  },
  user: { select: { id: true, fullName: true, email: true, phone: true } },
};

/** Tên sản phẩm của hoá đơn (gói tự tập, khóa học hoặc chênh lệch đổi) để hiển thị / in. */
export const purchaseLabel = (invoice) => invoice.planName ?? invoice.plan?.name ?? 'Hoá đơn';

/** Thời hạn mua: số ngày của gói, hoặc số buổi của khóa học. */
export const purchaseTerm = (invoice) => {
  if (invoice.sessionCount) return `${invoice.sessionCount} buổi`;
  const days = invoice.durationDays ?? invoice.plan?.durationDays;
  return days ? `${days} ngày` : '—';
};

/**
 * Tổng tiền của hoá đơn đã nạp kèm payments/refunds: đã thu, đã hoàn và thực giữ lại.
 * @param {{ payments?: { receivedAmount: number }[], refunds?: { amount: number }[] }} invoice
 */
export const invoiceTotals = (invoice) => {
  const paidAmount = (invoice.payments ?? []).reduce((sum, p) => sum + p.receivedAmount, 0);
  const refundedAmount = (invoice.refunds ?? []).reduce((sum, r) => sum + r.amount, 0);
  return { paidAmount, refundedAmount, receivedAmount: paidAmount - refundedAmount };
};

/** Dữ liệu bản in chỉ được tạo từ hoá đơn PAID và giữ nguyên số tiền gốc. */
export const getReceipt = async (id, actor, canReadAll) => {
  const invoice = await getInvoice(id, actor, canReadAll);
  if (invoice.status !== Enums.InvoiceStatus.PAID) {
    throw ApiError.businessRule('Chỉ in hoặc xuất hoá đơn đã thanh toán');
  }
  return {
    invoice,
    center: invoice.centerInfo,
    currency: invoice.currency,
  };
};
async function createdInvoiceIds(userId) {
  const rows = await prisma.auditLog.findMany({
    where: { userId, entity: 'Invoice', action: 'CREATE' },
    select: { entityId: true },
  });
  return rows.map((row) => Number(row.entityId)).filter(Number.isSafeInteger);
}
function invoiceWhere(query, userId, createdIds) {
  return {
    ...(userId && { userId }),
    ...(createdIds && { id: { in: createdIds } }),
    ...(query.status && { status: query.status }),
    ...(query.channel && { channel: query.channel }),
    ...((query.from || query.to) && {
      createdAt: { ...(query.from && { gte: query.from }), ...(query.to && { lte: query.to }) },
    }),
    ...(query.search && {
      OR: [
        { code: { contains: query.search } },
        { user: { fullName: { contains: query.search } } },
      ],
    }),
  };
}

/** Danh sách read_own luôn lấy userId từ token, không nhận id tùy ý từ query. */
export const listInvoices = async (query, actor, canReadAll) => {
  const userId = canReadAll ? query.memberId : actor.id;
  const createdIds = canReadAll && query.createdByMe ? await createdInvoiceIds(actor.id) : null;
  const where = invoiceWhere(query, userId, createdIds);
  const [items, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      include: INVOICE_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.invoice.count({ where }),
  ]);
  const currency = await settingService.getValue(SETTING_KEYS.CURRENCY);
  return {
    // UC-PAY-08: số đã nhận để hiện "đã nhận X / còn thiếu Y" với hoá đơn chuyển bù.
    items: items.map((item) => ({ ...item, currency, ...invoiceTotals(item) })),
    meta: buildPageMeta({ ...query, total }),
  };
};

/** Chi tiết có thông tin trung tâm để chủ hóa đơn in mà không cần setting.read. */
export const getInvoice = async (id, actor, canReadAll) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, ...(!canReadAll && { userId: actor.id }) },
    include: INVOICE_INCLUDE,
  });
  if (!invoice) throw ApiError.notFound('Không tìm thấy hóa đơn trong phạm vi truy cập');
  const [name, address, phone, currency, claimWindowDays] = await Promise.all(
    [
      SETTING_KEYS.CENTER_NAME,
      SETTING_KEYS.CENTER_ADDRESS,
      SETTING_KEYS.CENTER_PHONE,
      SETTING_KEYS.CURRENCY,
      SETTING_KEYS.PAYMENT_CLAIM_WINDOW_DAYS,
    ].map((key) => settingService.getValue(key)),
  );
  const collectors = await prisma.user.findMany({
    where: { id: { in: invoice.payments.map((item) => item.actorId).filter(Boolean) } },
    select: { id: true, fullName: true },
  });
  const payments = invoice.payments.map((payment) => ({
    ...payment,
    actor: collectors.find((collector) => collector.id === payment.actorId) ?? null,
  }));
  const totals = invoiceTotals(invoice);
  return {
    ...invoice,
    ...totals,
    // FE không đọc được system_settings: trả sẵn số được hoàn và hạn báo "đã chuyển khoản".
    refundableAmount: invoice.status === Enums.InvoiceStatus.PAID ? totals.receivedAmount : 0,
    claimDeadline:
      invoice.status === Enums.InvoiceStatus.FAILED
        ? new Date(invoice.expiresAt.getTime() + claimWindowDays * TIME.MS_PER_DAY)
        : null,
    payments,
    centerInfo: { name, address, phone },
    currency,
    paymentInstruction: await buildPaymentInstruction(invoice),
  };
};
