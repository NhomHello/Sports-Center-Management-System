export const CASE_STATUS = Object.freeze({
  OPEN: 'OPEN',
  WAITING_MEMBER: 'WAITING_MEMBER',
  WAITING_TOPUP: 'WAITING_TOPUP',
  MATCHED: 'MATCHED',
  REJECTED: 'REJECTED',
  IGNORED: 'IGNORED',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
});
export const CASE_STATUS_LABELS = Object.freeze({
  OPEN: 'Chưa xử lý',
  WAITING_MEMBER: 'Chờ hội viên',
  WAITING_TOPUP: 'Chờ chuyển bù',
  MATCHED: 'Đã đối soát',
  REJECTED: 'Đã từ chối',
  IGNORED: 'Đã bỏ qua',
  REFUND_PENDING: 'Chờ hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
});
export const CASE_REASON = Object.freeze({
  NO_MATCH: 'NO_MATCH',
  LATE: 'LATE',
  UNDERPAID: 'UNDERPAID',
  OVERPAID: 'OVERPAID',
  DUPLICATE_TRANSFER: 'DUPLICATE_TRANSFER',
  MEMBER_CLAIM: 'MEMBER_CLAIM',
});
export const CASE_REASON_LABELS = Object.freeze({
  NO_MATCH: 'Sai hoặc thiếu mã',
  LATE: 'Tiền về muộn',
  UNDERPAID: 'Thiếu tiền',
  OVERPAID: 'Thừa tiền',
  DUPLICATE_TRANSFER: 'Chuyển khoản hai lần',
  MEMBER_CLAIM: 'Hội viên báo đã chuyển',
});
export const CONTACT_LABELS = Object.freeze({
  PHONE: 'Điện thoại',
  ZALO: 'Zalo',
  EMAIL: 'Email',
  COUNTER: 'Tại quầy',
});
/** Khớp ACTIVE_STATUSES của BE: phiếu chờ hoàn tiền vẫn đang mở (chưa chuyển trả xong). */
export const ACTIVE_CASE_STATUSES = Object.freeze([
  CASE_STATUS.OPEN,
  CASE_STATUS.WAITING_MEMBER,
  CASE_STATUS.WAITING_TOPUP,
  CASE_STATUS.REFUND_PENDING,
]);
/** BR-PAY-19: lý do phải ghi ít nhất một lần liên hệ trước khi đóng phiếu. */
export const CONTACT_REQUIRED_REASONS = Object.freeze([
  CASE_REASON.DUPLICATE_TRANSFER,
  CASE_REASON.OVERPAID,
  CASE_REASON.MEMBER_CLAIM,
]);
export const REFUND_STATUS = Object.freeze({ PENDING: 'PENDING', DONE: 'DONE' });
/** Số hoá đơn tối đa mỗi trạng thái khi chọn hoá đơn để gán giao dịch (giới hạn pageSize của API). */
export const MAP_INVOICE_PAGE_SIZE = 100;
