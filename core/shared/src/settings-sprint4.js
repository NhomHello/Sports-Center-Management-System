import { SETTING_GROUPS as G, SETTING_TYPES as T } from './setting-constants.js';
const number = (key, value, label, maxValue) => ({
  key,
  defaultValue: String(value),
  label,
  description: label,
  type: T.NUMBER,
  group: G.CLASS,
  minValue: 1,
  maxValue,
  integer: true,
});
/** BR-S4-01..15: mặc định chỉ dùng để seed, nghiệp vụ đọc giá trị đã lưu trong DB. */
export const SPRINT4_SETTINGS = [
  number('COURSE_SUMMARY_REMINDER_DAYS', 2, 'Nhắc tổng kết trước hạn (ngày)', 365),
  number('COURSE_SUMMARY_DEADLINE_DAYS', 7, 'Hạn nộp tổng kết khoá (ngày)', 365),
  number('COURSE_PASS_MIN_ATTENDANCE_PERCENT', 70, 'Chuyên cần gợi ý đạt (%)', 100),
  number('COURSE_RATING_WINDOW_DAYS', 14, 'Thời hạn đánh giá khoá (ngày)', 365),
  number('COACH_MEMBER_VIEW_DAYS', 30, 'HLV xem hồ sơ sau khoá (ngày)', 365),
  number('COACH_BIO_MAX_LENGTH', 1000, 'Giới thiệu HLV tối đa (ký tự)', 10000),
  {
    key: 'REPORT_MAX_DAYS_BY_GROUP',
    defaultValue: '{"day":92,"week":366,"month":1827,"quarter":1827,"year":1827}',
    label: 'Khoảng báo cáo tối đa theo nhóm',
    description: 'Giới hạn số ngày theo day/week/month/quarter/year',
    type: T.JSON,
    group: G.PAYMENT,
  },
];
