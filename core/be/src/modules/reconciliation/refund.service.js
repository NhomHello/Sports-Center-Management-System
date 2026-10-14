import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, TIME } from '../../constants/index.js';
import { lockInvoice, sumReceived } from '../payment/payment-apply.service.js';
import { fmtMoney, sendNotices, toMember } from './payment-notify.service.js';
import { assertContacted, lockCase, updateCase } from './reconciliation-case.service.js';

const { ReconciliationStatus: STATUS, ReconciliationReason: REASON } = Enums;
const TX = { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted };

const audit = (tx, actor, { entity, entityId, meta }) =>
  tx.auditLog.create({
    data: {
      userId: actor.id,
      action: AUDIT_ACTIONS.UPDATE,
      entity,
      entityId: String(entityId),
      meta,
    },
  });

const refundNotice = (userId, amount, key) =>
  userId
    ? [
        toMember({
          userId,
          kind: Enums.NotificationKind.PAYMENT_REFUND,
          eventKey: key,
          title: `Trung tâm sẽ hoàn ${fmtMoney(amount)} cho bạn`,
          message:
            'Tiền được chuyển trả về tài khoản đã chuyển; bạn sẽ nhận thông báo khi hoàn tất.',
        }),
      ]
    : [];

/** Số tối đa được hoàn theo lý do phiếu: phần thừa, số đã nhận của hoá đơn, hoặc cả giao dịch. */
const refundableAmount = async (tx, kase) => {
  if (kase.reason === REASON.MEMBER_CLAIM)
    throw ApiError.businessRule('Phiếu báo đã chuyển chưa có tiền được xác nhận để hoàn');
  if (kase.reason === REASON.OVERPAID) return kase.excessAmount;
  if (kase.reason === REASON.UNDERPAID) return sumReceived(tx, kase.invoiceId);
  return kase.amount;
};

/** Thiếu tiền mà hoàn lại số đã nhận: hoá đơn không bao giờ được kích hoạt gói (BR-3.2). */
const failUnpaidInvoice = async (tx, kase, actor) => {
  if (kase.reason !== REASON.UNDERPAID) return;
  const invoice = await lockInvoice(tx, { id: kase.invoiceId });
  if (invoice?.status !== Enums.InvoiceStatus.PENDING) return;
  await tx.invoice.update({
    where: { id: invoice.id },
    data: { status: Enums.InvoiceStatus.FAILED },
  });
  await audit(tx, actor, {
    entity: ENTITIES.INVOICE,
    entityId: invoice.id,
    meta: {
      before: { status: invoice.status },
      after: { status: Enums.InvoiceStatus.FAILED },
      reason: 'REFUND_UNDERPAID',
    },
  });
};

/**
 * Tạo yêu cầu hoàn tiền từ phiếu đối soát (chuyển thừa, chuyển lặp, sai mã, quá hạn chuyển bù).
 * Tiền trả thủ công ngoài hệ thống; phiếu chờ mã tham chiếu ở completeRefund (BR-PAY-13).
 */
export const requestCaseRefund = async (id, { amount, reason }, actor) => {
  const refund = await prisma.$transaction(async (tx) => {
    const kase = await lockCase(tx, id);
    assertContacted(kase);
    const pending = await tx.refund.count({
      where: { caseId: id, status: Enums.RefundStatus.PENDING },
    });
    if (pending) throw ApiError.conflict('Phiếu đã có yêu cầu hoàn đang chờ chuyển tiền');
    const max = await refundableAmount(tx, kase);
    const value = amount ?? max;
    if (!max || value > max) throw ApiError.businessRule(`Số hoàn tối đa là ${fmtMoney(max ?? 0)}`);
    await failUnpaidInvoice(tx, kase, actor);
    const created = await tx.refund.create({
      data: {
        caseId: id,
        invoiceId: kase.invoiceId,
        amount: value,
        reason,
        requestedById: actor.id,
      },
    });
    await updateCase(tx, kase, {
      data: { status: STATUS.REFUND_PENDING },
      actor,
      action: 'REFUND_REQUEST',
    });
    return { ...created, userId: kase.userId };
  }, TX);
  await sendNotices(refundNotice(refund.userId, refund.amount, `refund:${refund.id}`));
  return refund;
};

/** Hoàn hoá đơn rút lại đúng số ngày hoá đơn đã cộng; hết ngày thì gói kết thúc (chốt nhóm 14/10). */
const shrinkMembership = async (tx, invoice) => {
  if (!invoice.membershipId) return null;
  const membership = await tx.membership.findUnique({ where: { id: invoice.membershipId } });
  const days = invoice.durationDays ?? invoice.plan.durationDays;
  const endDate = new Date(membership.endDate.getTime() - days * TIME.MS_PER_DAY);
  const ended = endDate <= new Date();
  return tx.membership.update({
    where: { id: membership.id },
    data: {
      endDate,
      ...(ended && { status: Enums.MembershipStatus.EXPIRED, activeUserId: null }),
    },
  });
};

/** UC-PAY-09: Manager hoàn một hoá đơn PAID ⇒ REFUNDED, rút ngày khỏi gói, tạo yêu cầu chuyển trả. */
export const refundInvoice = async (invoiceId, { amount, reason }, actor) => {
  const refund = await prisma.$transaction(async (tx) => {
    const invoice = await lockInvoice(tx, { id: invoiceId });
    if (!invoice) throw ApiError.notFound('Không tìm thấy hoá đơn');
    if (invoice.status !== Enums.InvoiceStatus.PAID)
      throw ApiError.conflict('Chỉ hoàn tiền hoá đơn đã thanh toán');
    const received = await sumReceived(tx, invoice.id);
    const value = amount ?? received;
    if (value <= 0 || value > received)
      throw ApiError.businessRule(`Số hoàn phải từ 1 đến ${fmtMoney(received)}`);
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: Enums.InvoiceStatus.REFUNDED },
    });
    const membership = await shrinkMembership(tx, invoice);
    const created = await tx.refund.create({
      data: { invoiceId: invoice.id, amount: value, reason, requestedById: actor.id },
    });
    await audit(tx, actor, {
      entity: ENTITIES.INVOICE,
      entityId: invoice.id,
      meta: {
        before: { status: invoice.status },
        after: { status: Enums.InvoiceStatus.REFUNDED },
        refundId: created.id,
        amount: value,
        reason,
        membershipEndDate: membership?.endDate,
      },
    });
    return { ...created, userId: invoice.userId };
  }, TX);
  await sendNotices(refundNotice(refund.userId, refund.amount, `refund:${refund.id}`));
  return refund;
};

/** Đóng yêu cầu hoàn bằng mã tham chiếu ngân hàng; phiếu đối soát liên quan chuyển REFUNDED. */
export const completeRefund = (id, { reference }, actor) =>
  prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${id} FOR UPDATE`;
    const refund = await tx.refund.findUnique({ where: { id } });
    if (!refund) throw ApiError.notFound('Không tìm thấy yêu cầu hoàn tiền');
    if (refund.status !== Enums.RefundStatus.PENDING)
      throw ApiError.conflict('Yêu cầu hoàn tiền đã hoàn tất');
    const done = await tx.refund.update({
      where: { id },
      data: {
        status: Enums.RefundStatus.DONE,
        reference,
        completedById: actor.id,
        completedAt: new Date(),
      },
    });
    if (refund.caseId) {
      const kase = await lockCase(tx, refund.caseId);
      await updateCase(tx, kase, {
        data: { status: STATUS.REFUNDED },
        actor,
        action: 'REFUND_DONE',
      });
    }
    await audit(tx, actor, {
      entity: ENTITIES.REFUND,
      entityId: id,
      meta: { reference, amount: refund.amount },
    });
    return done;
  }, TX);

/** Danh sách yêu cầu hoàn tiền để kế toán/Manager theo dõi việc chuyển trả. */
export const listRefunds = async (query) => {
  const where = query.status ? { status: query.status } : {};
  const [items, total] = await prisma.$transaction([
    prisma.refund.findMany({
      where,
      include: { invoice: { select: { id: true, code: true, userId: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.refund.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};
