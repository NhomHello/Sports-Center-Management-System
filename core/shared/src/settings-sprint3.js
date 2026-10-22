import { SETTING_GROUPS as G, SETTING_TYPES as T } from './setting-constants.js';

const number = (key, defaultValue, label, group, minValue, maxValue) => ({
  key,
  defaultValue: String(defaultValue),
  label,
  description: label,
  type: T.NUMBER,
  group,
  minValue,
  maxValue,
  integer: true,
});

/** BR-1.16 / BR-2.16 / BR-2.17: cấu hình dùng chung và được seed vào DB. */
export const SPRINT3_SETTINGS = [
  number('LOGIN_MAX_FAILED_ATTEMPTS', 5, 'Số lần đăng nhập sai tối đa', G.ACCOUNT, 1, 100),
  number('LOGIN_LOCK_MINUTES', 15, 'Thời gian khoá đăng nhập (phút)', G.ACCOUNT, 1, 1440),
  number('MEMBERSHIP_FREEZE_MIN_DAYS', 7, 'Bảo lưu tối thiểu (ngày)', G.MEMBERSHIP, 1, 365),
  number('MEMBERSHIP_FREEZE_MAX_DAYS', 30, 'Bảo lưu tối đa (ngày)', G.MEMBERSHIP, 7, 365),
  number('MEMBERSHIP_FREEZE_MAX_TIMES', 2, 'Số lần bảo lưu tối đa mỗi gói', G.MEMBERSHIP, 0, 20),
  number('CLASS_WAITLIST_HOLD_HOURS', 12, 'Giữ chỗ danh sách chờ (giờ)', G.CLASS, 1, 168),
  number('CLASS_NO_SHOW_LIMIT', 3, 'Số buổi vắng để chặn đăng ký', G.CLASS, 1, 100),
  number('CLASS_NO_SHOW_WINDOW_DAYS', 30, 'Khoảng đếm vắng mặt (ngày)', G.CLASS, 1, 365),
  number('CLASS_NO_SHOW_BLOCK_DAYS', 7, 'Thời gian chặn đăng ký (ngày)', G.CLASS, 1, 365),
  number('ATTENDANCE_EDIT_HOURS', 24, 'Thời lượng mở lại điểm danh thủ công (giờ)', G.CLASS, 1, 168),
  {
    key: 'CHECKIN_ALLOW_EXPIRED',
    defaultValue: 'true',
    label: 'Cho check-in gói hết hạn kèm cảnh báo',
    description: 'Lễ tân xác nhận lượt đến; không tự kích hoạt gói',
    type: T.BOOLEAN,
    group: G.MEMBERSHIP,
  },
];
