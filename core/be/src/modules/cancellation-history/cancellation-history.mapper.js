import { Enums } from '../../config/db.js';
import { refundCode } from '../reconciliation/refund-reference.js';

export const HISTORY_INCLUDE = {
  user: { select: { id: true, fullName: true } },
  actor: { select: { id: true, fullName: true } },
  fromInvoice: { select: { id: true, code: true, classId: true, planName: true } },
  refund: {
    select: {
      id: true,
      amount: true,
      status: true,
      reference: true,
      completedAt: true,
      reason: true,
    },
  },
  creditTransactions: { select: { id: true, amount: true, note: true } },
};

const snapshotFields = (change, snapshot) => ({
  courseId: snapshot.classId ?? change.fromInvoice.classId,
  courseName: snapshot.courseName ?? change.fromInvoice.planName,
  purchasedSessions: snapshot.purchasedSessions ?? null,
  remainingSessions: snapshot.remainingSessions ?? null,
  usedSessions: snapshot.usedSessions ?? null,
  cancelledSessions: snapshot.cancelledSessions ?? null,
});
const reasonFor = (change, meta) =>
  meta.reason ?? change.refund?.reason ?? change.creditTransactions[0]?.note ?? null;
const payoutFor = (change) => ({
  refund: change.refund ? { ...change.refund, code: refundCode(change.refund.id) } : null,
  payoutStatus:
    change.refund?.status ??
    (change.settlement === Enums.SettlementMode.CREDIT ? 'LEGACY_CREDIT' : 'NONE'),
});

/** Lịch sử lấy số đã chốt lúc hủy, không tính lại theo giá/lịch hoặc đăng ký hiện tại. */
export const historyView = (change, meta = {}) => ({
  id: change.id,
  cancelledAt: change.createdAt,
  member: change.user,
  actor: change.actor,
  ...snapshotFields(change, meta.cancellation ?? {}),
  invoice: { id: change.fromInvoice.id, code: change.fromInvoice.code },
  reason: reasonFor(change, meta),
  paidAmount: change.paidAmount,
  remainingValue: change.remainingValue,
  fee: change.fee,
  refundAmount: Math.max(0, -change.difference),
  settlement: change.settlement,
  ...payoutFor(change),
});
