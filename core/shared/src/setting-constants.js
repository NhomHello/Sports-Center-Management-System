/** Kiểu giá trị và nhóm hiển thị của system settings (dùng chung các file khai báo setting). */

export const SETTING_TYPES = Object.freeze({
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
});

export const SETTING_GROUPS = Object.freeze({
  CENTER: 'CENTER',
  ACCOUNT: 'ACCOUNT',
  MEMBERSHIP: 'MEMBERSHIP',
  CLASS: 'CLASS',
  PAYMENT: 'PAYMENT',
  AI: 'AI',
});
