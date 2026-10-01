/**
 * Hang so KY THUAT cua backend (khong phai so nghiep vu).
 * So nghiep vu (7 ngay nhac han, 12 gio huy lop...) => bang system_settings, KHONG de o day.
 */

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
});

export const TIME = Object.freeze({
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  VIETNAM_ZONE: 'Asia/Ho_Chi_Minh',
});

export const AUTH = Object.freeze({
  HEADER: 'authorization',
  SCHEME: 'Bearer',
});

export const VALIDATION = Object.freeze({
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  SEARCH_MAX_LENGTH: 100,
  INVOICE_SEQUENCE_WIDTH: 6,
  /** So dien thoai VN: 0xxxxxxxxx hoac +84xxxxxxxxx */
  PHONE_REGEX: /^(0|\+84)\d{9}$/,
  /** Ma role: IN_HOA_SNAKE, 3-50 ky tu */
  ROLE_CODE_REGEX: /^[A-Z][A-Z0-9_]{2,49}$/,
  NOTIFICATION_IDS_MAX: 100,
  PAYMENT_REFERENCE_MAX_LENGTH: 100,
});

export const AUDIT_ACTIONS = Object.freeze({
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ASSIGN_ROLE: 'ASSIGN_ROLE',
  CHANGE_STATUS: 'CHANGE_STATUS',
  PAYMENT: 'PAYMENT',
});

export const ENTITIES = Object.freeze({
  USER: 'User',
  ROLE: 'Role',
  SETTING: 'SystemSetting',
  INVOICE: 'Invoice',
  NOTIFICATION: 'Notification',
  MEMBERSHIP: 'Membership',
  PAYMENT: 'Payment',
});

/** Ma loi Prisma hay gap: https://www.prisma.io/docs/orm/reference/error-reference */
export const PRISMA_ERROR = Object.freeze({
  UNIQUE_VIOLATION: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
  FOREIGN_KEY_VIOLATION: 'P2003',
});

export const HEALTH_PATH = '/health';
