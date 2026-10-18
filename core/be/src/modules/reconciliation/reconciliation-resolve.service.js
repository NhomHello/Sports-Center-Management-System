import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { createOnlineOrder } from '../membership/membership-invoice.service.js';
import { applyTransfer, lockInvoice, PAYMENT_OUTCOME } from '../payment/payment-apply.service.js';
import { outcomeNotices } from './payment-notices.js';
import { sendNotices } from './payment-notify.service.js';
import {
  ACTIVE_STATUSES,
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
  return { kase: updated, invoice, result };
};

const finish = async (out, key) => {
  await sendNotices(outcomeNotices(out.invoice, out.result, key));
  return { ...out.kase, outcome: out.result.outcome, missing: out.result.missing };
};

const MAP_REASONS = [REASON.NO_MATCH, REASON.LATE];
const RENEW_REASONS = [REASON.DUPLICATE_TRANSFER, REASON.OVERPAID];

/** Điều kiện của từng thao tác; chạy cả trước khi tạo hoá đơn đích lẫn trong transaction. */
const RULES = {
  map: (kase) => {
    if (!MAP_REASONS.includes(kase.reason) || !kase.webhookLog)
      throw ApiError.businessRule('Chỉ map được giao dịch sai mã hoặc tiền về muộn');
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

/**
 * Kiểm tra trước (không khoá) để không tạo hoá đơn online "mồ côi" khi thao tác bị từ chối;
 * transaction phía sau vẫn kiểm tra lại dưới khoá.
 */
const precheck = async (id, rule) => {
  const kase = await prisma.reconciliationCase.findUnique({
    where: { id },
    include: { webhookLog: true, _count: { select: { contacts: true } } },
  });
  if (!kase) throw ApiError.notFound('Không tìm thấy phiếu đối soát');
  if (!ACTIVE_STATUSES.includes(kase.status))
    throw ApiError.conflict('Phiếu đối soát đã được xử lý, vui lòng tải lại');
  rule(kase);
  await assertNotRefunded(prisma, kase);
  return kase;
};

/** Hoá đơn đích: chọn hoá đơn có sẵn, hoặc tạo/tái sử dụng hoá đơn online cho gói đang bán. */
const resolveTargetInvoice = async ({ invoiceId, memberId, planId }, actor) =>
  invoiceId ?? (await createOnlineOrder({ memberId, planId }, actor)).id;

/**
 * UC-PAY-11: gán giao dịch sai mã / tiền về muộn vào hoá đơn của hội viên.
 * @param {number} id phiếu đối soát
 * @param {{ invoiceId?: number, memberId?: number, planId?: number }} body
 */
export const mapCase = async (id, body, actor) => {
  await precheck(id, RULES.map);
  const target = await resolveTargetInvoice(body, actor);
  const out = await prisma.$transaction(async (tx) => {
    const kase = await lockForAction(tx, id, RULES.map);
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
export const renewFromCase = async (id, { planId }, actor) => {
  const preview = await precheck(id, RULES.renew);
  const target = await resolveTargetInvoice({ memberId: preview.userId, planId }, actor);
  const out = await prisma.$transaction(async (tx) => {
    const kase = await lockForAction(tx, id, RULES.renew);
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
