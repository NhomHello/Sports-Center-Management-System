import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';

const { ReconciliationStatus: STATUS, ReconciliationReason: REASON } = Enums;

/** Trạng thái phiếu còn đang xử lý; các trạng thái khác là đã đóng. */
export const ACTIVE_STATUSES = [
  STATUS.OPEN,
  STATUS.WAITING_MEMBER,
  STATUS.WAITING_TOPUP,
  STATUS.REFUND_PENDING,
];

/** BR-PAY-19: các lý do phải có ít nhất một lần liên hệ hội viên trước khi đóng phiếu. */
export const CONTACT_REQUIRED = [REASON.DUPLICATE_TRANSFER, REASON.OVERPAID, REASON.MEMBER_CLAIM];

/**
 * Mở phiếu đối soát. Thiếu tiền mở ở trạng thái chờ chuyển bù, còn lại mở ở OPEN.
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
export const openCase = (tx, data) =>
  tx.reconciliationCase.create({
    data: {
      status: data.reason === REASON.UNDERPAID ? STATUS.WAITING_TOPUP : STATUS.OPEN,
      ...data,
    },
  });

/** Chuyển bù nhiều lần vẫn thiếu: giữ một phiếu UNDERPAID cho mỗi hoá đơn, chỉ cập nhật ghi chú. */
export const openOrRefreshTopupCase = async (tx, invoice, log) => {
  const existing = await tx.reconciliationCase.findFirst({
    where: { invoiceId: invoice.id, reason: REASON.UNDERPAID, status: { in: ACTIVE_STATUSES } },
  });
  if (existing) {
    return tx.reconciliationCase.update({
      where: { id: existing.id },
      data: { status: STATUS.WAITING_TOPUP, note: log.reason },
    });
  }
  return openCase(tx, {
    reason: REASON.UNDERPAID,
    webhookLogId: log.id,
    invoiceId: invoice.id,
    userId: invoice.userId,
    amount: log.transferAmount,
    note: log.reason,
  });
};

/** Khoá phiếu (FOR UPDATE) và chặn thao tác trên phiếu đã đóng (409 để FE tải lại). */
export const lockCase = async (tx, id) => {
  await tx.$queryRaw`SELECT id FROM reconciliation_cases WHERE id = ${id} FOR UPDATE`;
  const kase = await tx.reconciliationCase.findUnique({
    where: { id },
    include: { webhookLog: true, _count: { select: { contacts: true } } },
  });
  if (!kase) throw ApiError.notFound('Không tìm thấy phiếu đối soát');
  if (!ACTIVE_STATUSES.includes(kase.status))
    throw ApiError.conflict('Phiếu đối soát đã được xử lý, vui lòng tải lại');
  return kase;
};

/**
 * Phiếu đã có lệnh hoàn (đang chờ chuyển hoặc đã chuyển) thì khoản tiền đó đã thuộc về hội viên:
 * không được dùng lại để map, xác nhận hay gia hạn, tránh một khoản tiền tiêu hai lần.
 */
export const assertNotRefunded = async (tx, kase) => {
  const refunds = await tx.refund.count({ where: { caseId: kase.id } });
  if (refunds)
    throw ApiError.conflict('Phiếu đã có yêu cầu hoàn tiền, không dùng khoản này được nữa');
};

/** BR-PAY-19: chặn đóng phiếu khi chưa ghi lại lần liên hệ nào với hội viên. */
export const assertContacted = (kase) => {
  if (CONTACT_REQUIRED.includes(kase.reason) && kase._count.contacts === 0) {
    throw ApiError.businessRule('Cần ghi lại ít nhất một lần liên hệ hội viên trước khi xử lý');
  }
};

/** Cập nhật phiếu, đồng bộ trạng thái log webhook và ghi audit trong cùng transaction. */
export const updateCase = async (tx, kase, { data, actor, action }) => {
  const now = new Date();
  const closing = data.status && !ACTIVE_STATUSES.includes(data.status);
  const updated = await tx.reconciliationCase.update({
    where: { id: kase.id },
    data: { ...data, ...(closing && { resolvedAt: now, resolvedById: actor.id }) },
  });
  if (closing && kase.webhookLogId) {
    await tx.paymentWebhookLog.update({
      where: { id: kase.webhookLogId },
      data: { status: Enums.WebhookLogStatus.RESOLVED, reviewedById: actor.id, reviewedAt: now },
    });
  }
  await tx.auditLog.create({
    data: {
      userId: actor.id,
      action: AUDIT_ACTIONS.UPDATE,
      entity: ENTITIES.RECONCILIATION_CASE,
      entityId: String(kase.id),
      meta: { action, before: { status: kase.status, reason: kase.reason }, after: data },
    },
  });
  return updated;
};
