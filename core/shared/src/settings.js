/**
 * SYSTEM SETTINGS - mọi con số / chuỗi nghiệp vụ đều là cấu hình, KHÔNG hardcode trong logic.
 * Giá trị mặc định ở đây chỉ dùng để SEED lần đầu; sau đó Center Manager sửa qua UI
 * (bảng system_settings). Code đọc giá trị qua settingService.getValue(SETTING_KEYS.X),
 * không đọc trực tiếp từ file này.
 */

export const SETTING_TYPES = Object.freeze({
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
});

export const SETTING_GROUPS = Object.freeze({
  CENTER: 'CENTER',
  MEMBERSHIP: 'MEMBERSHIP',
  CLASS: 'CLASS',
  PAYMENT: 'PAYMENT',
  AI: 'AI',
});

/**
 * @typedef {Object} SettingDefinition
 * @property {string} key
 * @property {string} type  - một trong SETTING_TYPES
 * @property {string} defaultValue - luôn là string, parse theo type khi đọc
 * @property {string} label
 * @property {string} description
 * @property {string} group - một trong SETTING_GROUPS
 * @property {string} [unit]
 * @property {number} [minValue]
 * @property {number} [maxValue]
 */

/** @type {SettingDefinition[]} */
export const SETTING_DEFINITIONS = [
  {
    key: 'CENTER_NAME',
    type: SETTING_TYPES.STRING,
    defaultValue: 'Sports Center',
    label: 'Tên trung tâm',
    required: true,
    description: 'Hiển thị trên giao diện và hoá đơn',
    group: SETTING_GROUPS.CENTER,
  },
  {
    key: 'CENTER_ADDRESS',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Địa chỉ trung tâm',
    description: 'In trên hoá đơn',
    group: SETTING_GROUPS.CENTER,
  },
  {
    key: 'CENTER_PHONE',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Số điện thoại',
    description: 'In trên hoá đơn',
    group: SETTING_GROUPS.CENTER,
  },
  {
    key: 'MEMBERSHIP_EXPIRY_REMINDER_DAYS',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '7',
    label: 'Nhắc gia hạn trước (ngày)',
    integer: true,
    description: 'Gửi thông báo nhắc gia hạn trước ngày hết hạn gói',
    group: SETTING_GROUPS.MEMBERSHIP,
    unit: 'ngày',
    minValue: 0,
    maxValue: 365,
  },
  {
    key: 'CLASS_CANCEL_MIN_HOURS_BEFORE',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '12',
    label: 'Huỷ đăng ký lớp trước tối thiểu (giờ)',
    description: 'Hội viên chỉ được huỷ đăng ký trước giờ học số giờ này',
    group: SETTING_GROUPS.CLASS,
    unit: 'giờ',
    minValue: 0,
    maxValue: 168,
  },
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
    key: 'CURRENCY',
    type: SETTING_TYPES.STRING,
    defaultValue: 'VND',
    label: 'Đơn vị tiền tệ',
    required: true,
    format: 'currency',
    description: 'Mã tiền tệ hiển thị',
    group: SETTING_GROUPS.PAYMENT,
  },
  {
    key: 'AI_DAILY_REQUEST_LIMIT',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '20',
    label: 'Giới hạn yêu cầu AI mỗi ngày',
    description: 'Số yêu cầu AI tối đa cho một tài khoản trong một ngày Việt Nam',
    group: SETTING_GROUPS.AI,
    unit: 'yêu cầu/ngày',
    minValue: 1,
    maxValue: 1000,
  },
];

/**
 * Hằng số key để tham chiếu trong code: SETTING_KEYS.CLASS_CANCEL_MIN_HOURS_BEFORE
 * @type {Readonly<Record<string, string>>}
 */
export const SETTING_KEYS = Object.freeze(
  Object.fromEntries(SETTING_DEFINITIONS.map(({ key }) => [key, key])),
);
