import { PERMISSIONS as P } from '@scms/shared';
import { QUERY_KEYS } from '@/constants';

export const SETTLEMENT_OPTIONS = Object.freeze([
  { value: 'REFUND', label: 'Nhận tiền hoàn' },
  { value: 'CREDIT', label: 'Ghi vào số dư' },
]);
const isMoney = (value) => Number.isSafeInteger(value) && value >= 0;

/** Chỉ kiểm tra kiểu dữ liệu, không áp dụng công thức tiền hoặc phí trên FE. */
export const validCancelPreview = (data) =>
  Boolean(data) &&
  ['paidAmount', 'remainingValue', 'fee', 'refundAmount'].every((key) => isMoney(data[key]));
/** Chênh lệch được phép âm nhưng vẫn phải là số nguyên do API trả. */
export const validChangePreview = (data) =>
  Boolean(data) &&
  isMoney(data.remainingValue) &&
  isMoney(data.newPrice) &&
  Number.isSafeInteger(data.difference);
/** Quyền thực hiện phụ thuộc chính chủ hay thao tác hộ, không so sánh tên role. */
export function canManagePurchase({ kind, ownerId, userId, can }) {
  if (!ownerId || !userId) return false;
  if (kind === 'membership')
    return can(ownerId === userId ? P.MEMBERSHIP_PURCHASE : P.MEMBERSHIP_MANAGE);
  return can(ownerId === userId ? P.CLASS_CANCEL_SELF : P.CLASS_ENROLL_FOR_MEMBER);
}
/** Làm mới các container do cả hai FE phụ trách, kể cả chi tiết và lịch sử. */
export function refreshPurchases(client) {
  const keys = [
    QUERY_KEYS.SCHEDULE,
    QUERY_KEYS.MEMBERS,
    QUERY_KEYS.INVOICES,
    QUERY_KEYS.NOTIFICATIONS,
    QUERY_KEYS.ME,
    ['purchase'],
    ['credit'],
    ['ownMembership'],
    ['profile'],
    ['freeze-current'],
    ['member-current'],
    ['member-detail'],
  ];
  return Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
