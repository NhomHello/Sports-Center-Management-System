import {
  ACTIVE_CASE_STATUSES,
  CASE_REASON as R,
  CONTACT_REQUIRED_REASONS,
  REFUND_STATUS,
} from '@/constants/reconciliation';

/** Các thao tác dùng tiền của phiếu: chỉ khi phiếu còn mở và chưa có yêu cầu hoàn nào. */
const settleActions = (item, is) => ({
  map: is(R.NO_MATCH, R.LATE) && Boolean(item.webhookLog),
  confirm: is(R.MEMBER_CLAIM, R.UNDERPAID) && Boolean(item.invoiceId),
  renew: is(R.DUPLICATE_TRANSFER, R.OVERPAID),
  reject: is(R.MEMBER_CLAIM),
  ignore: is(R.NO_MATCH) && !item.invoiceId,
});
const NONE = Object.freeze({
  map: false,
  confirm: false,
  renew: false,
  reject: false,
  ignore: false,
});

/**
 * Thao tác được phép trên một phiếu đối soát, khớp điều kiện của API /reconciliations/:id/*.
 * Phiếu đã có yêu cầu hoàn thì không map/xác nhận/gia hạn nữa để một khoản tiền không bị dùng hai lần.
 * @param {object} item phiếu từ GET /reconciliations/:id (có contacts, refunds)
 */
export const caseActions = (item) => {
  const active = ACTIVE_CASE_STATUSES.includes(item.status);
  const refunds = item.refunds ?? [];
  const pendingRefund = refunds.find((r) => r.status === REFUND_STATUS.PENDING) ?? null;
  const is = (...reasons) => reasons.includes(item.reason);
  return {
    active,
    pendingRefund,
    needsContact: CONTACT_REQUIRED_REASONS.includes(item.reason) && !item.contacts?.length,
    ...(active && refunds.length === 0 ? settleActions(item, is) : NONE),
    refund: active && !pendingRefund && !is(R.MEMBER_CLAIM),
  };
};
