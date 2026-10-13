/**
 * SYSTEM SETTINGS - mọi con số / chuỗi nghiệp vụ đều là cấu hình, KHÔNG hardcode trong logic.
 * Giá trị mặc định ở đây chỉ dùng để SEED lần đầu; sau đó Center Manager sửa qua UI
 * (bảng system_settings). Code đọc giá trị qua settingService.getValue(SETTING_KEYS.X),
 * không đọc trực tiếp từ file này.
 */

import { PAYMENT_SETTINGS } from './settings-payment.js';
import { SETTING_GROUPS, SETTING_TYPES } from './setting-constants.js';

export { SETTING_GROUPS, SETTING_TYPES };

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
  ...PAYMENT_SETTINGS,
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
    defaultValue: 'Khu đô thị ĐHQG TP.HCM, Dĩ An, Bình Dương',
    label: 'Địa chỉ trung tâm',
    required: true,
    minLength: 10,
    maxLength: 255,
    description: 'In trên hoá đơn',
    group: SETTING_GROUPS.CENTER,
  },
  {
    key: 'CENTER_PHONE',
    type: SETTING_TYPES.STRING,
    defaultValue: '028 7300 5588',
    label: 'Số điện thoại',
    required: true,
    format: 'phone',
    maxLength: 20,
    description: 'In trên hoá đơn',
    group: SETTING_GROUPS.CENTER,
  },
  {
    key: 'EMAIL_VERIFICATION_TTL_MINUTES',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '60',
    label: 'Hạn link xác minh email (phút)',
    integer: true,
    description: 'Link xác minh email gửi sau khi đăng ký hết hạn sau số phút này',
    group: SETTING_GROUPS.ACCOUNT,
    unit: 'phút',
    minValue: 5,
    maxValue: 10080,
  },
  {
    key: 'EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '60',
    label: 'Giãn cách gửi lại email xác minh / đặt lại mật khẩu (giây)',
    integer: true,
    description:
      'Khoảng chờ tối thiểu giữa hai lần gửi email xác minh hoặc đặt lại mật khẩu cho cùng một tài khoản',
    group: SETTING_GROUPS.ACCOUNT,
    unit: 'giây',
    minValue: 0,
    maxValue: 3600,
  },
  {
    key: 'PASSWORD_RESET_TTL_MINUTES',
    type: SETTING_TYPES.NUMBER,
    defaultValue: '15',
    label: 'Hạn link đặt lại mật khẩu (phút)',
    integer: true,
    description: 'Link quên mật khẩu hết hạn sau số phút này và chỉ dùng được một lần',
    group: SETTING_GROUPS.ACCOUNT,
    unit: 'phút',
    minValue: 5,
    maxValue: 1440,
  },
  {
    key: 'CENTER_SUPPORT_ZALO_URL',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Liên kết Zalo hỗ trợ',
    format: 'optionalUrl',
    maxLength: 200,
    description:
      'Hiện ở màn xác minh email để hội viên nhờ lễ tân xác minh thủ công. Để trống = ẩn',
    group: SETTING_GROUPS.CENTER,
  },
  {
    key: 'CENTER_SUPPORT_FACEBOOK_URL',
    type: SETTING_TYPES.STRING,
    defaultValue: '',
    label: 'Liên kết Facebook hỗ trợ',
    format: 'optionalUrl',
    maxLength: 200,
    description:
      'Hiện ở màn xác minh email để hội viên nhờ lễ tân xác minh thủ công. Để trống = ẩn',
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
