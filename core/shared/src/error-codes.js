/**
 * Mã lỗi thống nhất giữa BE và FE. BE trả về trong body { success:false, code, message }.
 * FE dựa vào `code` (không dựa vào message) để xử lý logic, message chỉ để hiển thị.
 */
export const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});
