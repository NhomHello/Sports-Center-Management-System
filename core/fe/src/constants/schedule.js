export const CLASS_STATUS = Object.freeze({
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
});

export const CLASS_STATUS_LABELS = Object.freeze({
  OPEN: 'Mở đăng ký',
  CLOSED: 'Đóng đăng ký',
  CANCELLED: 'Đã huỷ',
});

export const SCHEDULE_UI = Object.freeze({
  OPTION_PAGE_SIZE: 100,
  LAST_WEEKDAY: 6,
  DAYS_PER_WEEK: 7,
  DATE_PATTERN: 'YYYY-MM-DD',
  DATETIME_PATTERN: 'YYYY-MM-DDTHH:mm:ss',
});

export const WEEKDAYS = Object.freeze([
  { value: 1, label: 'Thứ Hai' },
  { value: 2, label: 'Thứ Ba' },
  { value: 3, label: 'Thứ Tư' },
  { value: 4, label: 'Thứ Năm' },
  { value: 5, label: 'Thứ Sáu' },
  { value: 6, label: 'Thứ Bảy' },
  { value: 0, label: 'Chủ nhật' },
]);
