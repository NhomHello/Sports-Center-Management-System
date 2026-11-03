import { abandonUnfundedCourseInvoice } from '../course-order/course-hold.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { reserveCourseWithDb } from '../course-order/course-order.service.js';
import { applyTransfer, lockInvoice, PAYMENT_OUTCOME } from '../payment/payment-apply.service.js';
import { outcomeNotices } from './payment-notices.js';
import { sendNotices } from './payment-notify.service.js';
import {
  assertContacted,
  assertNotRefunded,
  lockCase,
  openCase,
  updateCase,
} from './reconciliation-case.service.js';

const { ReconciliationStatus: STATUS, ReconciliationReason: REASON } = Enums;
const TX = { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted };
const PAYABLE = [Enums.InvoiceStatus.PENDING, Enums.InvoiceStatus.FAILED];

const NEXT_STATE = {
  [PAYMENT_OUTCOME.PAID]: () => ({ status: STATUS.MATCHED }),
  [PAYMENT_OUTCOME.UNDERPAID]: () => ({ status: STATUS.WAITING_TOPUP, reason: REASON.UNDERPAID }),
  [PAYMENT_OUTCOME.OVERPAID]: (result) => ({
    status: STATUS.OPEN,
    reason: REASON.OVERPAID,
    excessAmount: result.excess,
  }),
};

const lockPayableInvoice = async (tx, id) => {
  const invoice = await lockInvoice(tx, { id });
  if (!invoice) throw ApiError.notFound('Không tìm thấy hoá đơn');
  if (!PAYABLE.includes(invoice.status))
    throw ApiError.conflict('Hoá đơn đã thanh toán hoặc đã hoàn tiền, chọn hoá đơn khác');
  return invoice;
};

/**
 * Ghi nhận tiền của phiếu vào hoá đơn bằng đúng hàm của webhook (BR-PAY-15) rồi chuyển phiếu
 * sang trạng thái theo kết quả: đủ ⇒ MATCHED, thiếu ⇒ chờ chuyển bù, thừa ⇒ phiếu OVERPAID.
 */
const settleCase = async (tx, kase, invoice, { amount, reference, actor, action }) => {
  const result = await applyTransfer(tx, invoice, {
    amount,
    provider: Enums.PaymentProvider.MANUAL,
    reference,
    actorId: actor.id,
    meta: { caseId: kase.id, action },
  });
  if (kase.webhookLogId) {
    await tx.paymentWebhookLog.update({
      where: { id: kase.webhookLogId },
      data: { invoiceId: invoice.id },
    });
  }
  const data = {
    invoiceId: invoice.id,
    userId: invoice.userId,
    ...NEXT_STATE[result.outcome](result),
  };
  const updated = await updateCase(tx, kase, { data, actor, action });
  if (kase.invoiceId !== invoice.id)
    await abandonUnfundedCourseInvoice(tx, kase.invoiceId, {
      actor,
      reason: 'RECONCILIATION_MAPPED_TO_OTHER_COURSE',
    });
  return { kase: updated, invoice, result };
};

const finish = async (out, key) => {
  await sendNotices(outcomeNotices(out.invoice, out.result, key));
  return { ...out.kase, outcome: out.result.outcome, missing: out.result.missing };
};

const MAP_REASONS = [REASON.NO_MATCH, REASON.LATE, REASON.SCHEDULE_CONFLICT];
const RENEW_REASONS = [REASON.DUPLICATE_TRANSFER, REASON.OVERPAID];

/** Điều kiện của từng thao tác; chạy cả trước khi tạo hoá đơn đích lẫn trong transaction. */
const RULES = {
  map: (kase) => {
    if (!MAP_REASONS.includes(kase.reason) || !kase.webhookLog)
      throw ApiError.businessRule('Chỉ gán giao dịch chưa khớp, tiền muộn hoặc trùng lịch');
    if (kase.reason === REASON.SCHEDULE_CONFLICT) assertContacted(kase);
  },
  renew: (kase) => {
    if (!RENEW_REASONS.includes(kase.reason))
      throw ApiError.businessRule('Chỉ dùng gia hạn cho tiền chuyển lặp hoặc chuyển thừa');
    if (!kase.userId) throw ApiError.notFound('Không tìm thấy hội viên của phiếu đối soát');
    assertContacted(kase);
  },
};

/** Khoá phiếu rồi kiểm tra điều kiện thao tác và chặn khoản tiền đã có lệnh hoàn. */
const lockForAction = async (tx, id, rule) => {
  const kase = await lockCase(tx, id);
  rule(kase);
  await assertNotRefunded(tx, kase);
  return kase;
};

/** Phần thừa chỉ tồn tại sau khi hoá đơn gốc được chấp nhận; trước đó toàn bộ tiền còn treo. */
const assertOverpaidAccepted = async (db, kase) => {
  if (kase.reason !== REASON.OVERPAID) return;
  const invoice = await db.invoice.findUnique({ where: { id: kase.invoiceId } });
  if (invoice?.status === Enums.InvoiceStatus.PENDING)
    throw ApiError.businessRule('Chấp nhận hoá đơn gốc trước khi dùng phần thừa để gia hạn');
};

/** Hoá đơn đích: chọn hoá đơn có sẵn, hoặc tạo/tái sử dụng hoá đơn online cho gói đang bán. */
const resolveTargetInvoice = async (tx, { invoiceId, memberId, classId }, actor) =>
  invoiceId ??
  (
    await reserveCourseWithDb(
      tx,
      { memberId, classId, channel: Enums.InvoiceChannel.ONLINE },
      actor,
    )
  ).id;

/**
 * UC-PAY-11: gán giao dịch sai mã / tiền về muộn vào hoá đơn của hội viên.
 * @param {number} id phiếu đối soát
 * @param {{ invoiceId?: number, memberId?: number, planId?: number }} body
 */
export const mapCase = async (id, body, actor) => {
  const out = await prisma.$transaction(async (tx) => {
    const kase = await lockForAction(tx, id, RULES.map);
    const target = await resolveTargetInvoice(tx, body, actor);
    const invoice = await lockPayableInvoice(tx, target);
    const payload = kase.webhookLog.payload ?? {};
    const reference = payload.referenceCode ?? kase.webhookLog.providerTransactionId;
    return settleCase(tx, kase, invoice, { amount: kase.amount, reference, actor, action: 'MAP' });
  }, TX);
  return finish(out, `case:${id}:map`);
};

/**
 * UC-PAY-05/14: xác nhận khoản tiền thấy trên sao kê nhưng không có webhook (lỗi mạng, chuyển bù
 * tại ngân hàng khác...). Bắt buộc mã tham chiếu để đối chiếu về sau; phiếu hội viên báo đã chuyển
 * phải có lần liên hệ được ghi lại như khi từ chối (BR-PAY-19).
 */
export const confirmCase = async (id, { amount, reference }, actor) => {
  const out = await prisma.$transaction(async (tx) => {
    const kase = await lockForAction(tx, id, (item) => {
      if (![REASON.MEMBER_CLAIM, REASON.UNDERPAID].includes(item.reason) || !item.invoiceId)
        throw ApiError.businessRule(
          'Chỉ xác nhận thủ công cho phiếu báo đã chuyển hoặc chờ chuyển bù',
        );
      assertContacted(item);
    });
    const invoice = await lockPayableInvoice(tx, kase.invoiceId);
    return settleCase(tx, kase, invoice, { amount, reference, actor, action: 'CONFIRM' });
  }, TX);
  return finish(out, `case:${id}:confirm:${reference}`);
};

/**
 * BR-PAY-17/18: hội viên đồng ý dùng khoản chuyển lặp / phần thừa cho một lần gia hạn mới.
 * Phiếu gốc đóng; nếu số tiền không khớp giá gói thì hoá đơn mới mở phiếu thiếu/thừa riêng.
 */
export const renewFromCase = async (id, { classId }, actor) => {
  const out = await prisma.$transaction(async (tx) => {
    const kase = await lockForAction(tx, id, RULES.renew);
    await assertOverpaidAccepted(tx, kase);
    const target = await resolveTargetInvoice(tx, { memberId: kase.userId, classId }, actor);
    const amount = kase.reason === REASON.OVERPAID ? kase.excessAmount : kase.amount;
    const invoice = await lockPayableInvoice(tx, target);
    const result = await applyTransfer(tx, invoice, {
      amount,
      provider: Enums.PaymentProvider.MANUAL,
      reference: `CASE-${kase.id}`,
      actorId: actor.id,
      meta: { caseId: kase.id, fromInvoiceId: kase.invoiceId, action: 'RENEW' },
    });
    if (result.outcome !== PAYMENT_OUTCOME.PAID) {
      const next = NEXT_STATE[result.outcome](result);
      await openCase(tx, { ...next, invoiceId: invoice.id, userId: invoice.userId, amount });
    }
    const note = `Dùng ${amount} cho hoá đơn gia hạn ${invoice.code}`;
    const closed = await updateCase(tx, kase, {
      data: { status: STATUS.MATCHED, note },
      actor,
      action: 'RENEW',
    });
    return { kase: closed, invoice, result };
  }, TX);
  return finish(out, `case:${id}:renew`);
};
