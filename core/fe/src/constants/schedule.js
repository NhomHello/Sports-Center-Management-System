export const CLASS_STATUS = Object.freeze({
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
});
export const ENROLLMENT_STATUS = Object.freeze({ BOOKED: 'BOOKED', CANCELLED: 'CANCELLED' });
export const SESSION_STATUS = Object.freeze({
  SCHEDULED: 'SCHEDULED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
});
export const SCHEDULE_STATUS_LABELS = Object.freeze({
  OPEN: 'Mở đăng ký',
  CLOSED: 'Đóng đăng ký',
  CANCELLED: 'Đã huỷ',
  SCHEDULED: 'Theo lịch',
  COMPLETED: 'Đã hoàn thành',
  BOOKED: 'Đã đăng ký',
});
export const SCHEDULE_UI = Object.freeze({
  OPTION_PAGE_SIZE: 100,
  DAYS_PER_WEEK: 7,
  LAST_WEEKDAY: 6,
  MONDAY: 1,
  DATE_PATTERN: 'YYYY-MM-DD',
  DATETIME_PATTERN: 'YYYY-MM-DDTHH:mm:ss',
});
export const WEEKDAYS = [
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ nhật' },
];
