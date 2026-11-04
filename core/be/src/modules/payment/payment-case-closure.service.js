import { Enums } from '../../config/db.js';

const OPEN_STATUSES = [
  Enums.ReconciliationStatus.OPEN,
  Enums.ReconciliationStatus.WAITING_MEMBER,
  Enums.ReconciliationStatus.WAITING_TOPUP,
];

/** Tiền đã bù đủ: đóng phiếu thiếu/báo chuyển, kể cả đang xử lý phần chuyển thừa. */
export const closeCoveredPaymentCases = async (tx, invoiceId, actorId, now) => {
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
    data: {
      status: Enums.ReconciliationStatus.MATCHED,
      resolvedAt: now,
      resolvedById: actorId,
      note: 'Đã nhận đủ giá hóa đơn; phần chuyển thừa nếu có được xử lý ở phiếu riêng.',
    },
  });
  const logIds = cases.map((item) => item.webhookLogId).filter(Boolean);
  if (logIds.length) {
    await tx.paymentWebhookLog.updateMany({
      where: { id: { in: logIds } },
      data: { status: Enums.WebhookLogStatus.RESOLVED, reviewedById: actorId, reviewedAt: now },
    });
  }
};
