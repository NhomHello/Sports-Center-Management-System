export const CASE_STATUS = Object.freeze({
  OPEN: 'OPEN',
  WAITING_MEMBER: 'WAITING_MEMBER',
  WAITING_TOPUP: 'WAITING_TOPUP',
  MATCHED: 'MATCHED',
  REJECTED: 'REJECTED',
  IGNORED: 'IGNORED',
});
export const CASE_STATUS_LABELS = Object.freeze({
  OPEN: 'Chưa xử lý',
  WAITING_MEMBER: 'Chờ hội viên',
  WAITING_TOPUP: 'Chờ chuyển bù',
  MATCHED: 'Đã đối soát',
  REJECTED: 'Đã từ chối',
  IGNORED: 'Đã bỏ qua',
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
export const ACTIVE_CASE_STATUSES = Object.freeze([
  CASE_STATUS.OPEN,
  CASE_STATUS.WAITING_MEMBER,
  CASE_STATUS.WAITING_TOPUP,
]);
