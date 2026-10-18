import { TIME } from '../../constants/index.js';

/** Ngày lịch Việt Nam, không phụ thuộc múi giờ máy chủ. */
export const vietnamDate = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TIME.VIETNAM_ZONE }).format(now);

/** Biên nửa đêm theo ngày Việt Nam. */
export const vietnamDay = (now = new Date()) => new Date(`${vietnamDate(now)}T00:00:00+07:00`);

/** Biên ngày kế tiếp, dùng làm mốc loại trừ. */
export const nextDay = (date) => new Date(date.getTime() + TIME.MS_PER_DAY);

const dateTimeFormat = new Intl.DateTimeFormat('vi-VN', {
  timeZone: TIME.VIETNAM_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour12: false,
});

/** "HH:mm dd/MM/yyyy" theo giờ Việt Nam cho nội dung hiển thị/thông báo (BR-0.3). */
export const vietnamDateTime = (value) => dateTimeFormat.format(new Date(value));
