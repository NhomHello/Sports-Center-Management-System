/**
 * Cấu hình nhóm Thanh toán (hoá đơn, tài khoản nhận tiền online). Tách file để
 * settings.js không vượt giới hạn kích thước; được gộp vào SETTING_DEFINITIONS.
 */
import { SETTING_GROUPS, SETTING_TYPES } from './setting-constants.js';

/** @type {import('./settings.js').SettingDefinition[]} */
export const PAYMENT_SETTINGS = [
  {
    key: 'PAYMENT_ONLINE_TIMEOUT_MINUTES',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '15',
    label: 'Thời gian chờ thanh toán online (phút)',
    description: 'Quá thời gian này chưa nhận webhook thì giao dịch chuyển Failed',
    group: SETTING_GROUPS.PAYMENT,
    unit: 'phút',
    minValue: 1,
    maxValue: 1440,
  },
  {
    key: 'INVOICE_CODE_PREFIX',
    type: SETTING_TYPES.STRING,
    defaultValue: 'INV',
    label: 'Tiền tố mã hoá đơn',
    required: true,
    format: 'invoicePrefix',
    maxLength: 30,
    description: 'Mã hoá đơn = tiền tố + số tăng dần, dùng làm nội dung chuyển khoản',
    group: SETTING_GROUPS.PAYMENT,
  },
  {
    key: 'PAYMENT_BANK_CODE',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Ngân hàng nhận tiền (online)',
    description: 'Mã/tên ngân hàng dùng tạo QR, ví dụ ACB. Để trống = chưa mở thanh toán online',
    format: 'bankCode',
    maxLength: 20,
    group: SETTING_GROUPS.PAYMENT,
  },
  {
    key: 'PAYMENT_ACCOUNT_NUMBER',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Số tài khoản nhận tiền (online)',
    description: 'Phải trùng tài khoản đã liên kết trong SePay (Test mode hoặc Live)',
    format: 'bankAccountNumber',
    maxLength: 20,
    group: SETTING_GROUPS.PAYMENT,
  },
  {
    key: 'PAYMENT_ACCOUNT_NAME',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Tên chủ tài khoản nhận tiền',
    description: 'Hiển thị cho hội viên khi chuyển khoản',
    maxLength: 100,
    group: SETTING_GROUPS.PAYMENT,
  },
  {
    key: 'CURRENCY',
    type: SETTING_TYPES.STRING,
    defaultValue: 'VND',
    label: 'Đơn vị tiền tệ',
    required: true,
    format: 'currency',
    description: 'Mã tiền tệ hiển thị',
    group: SETTING_GROUPS.PAYMENT,
  },
];
