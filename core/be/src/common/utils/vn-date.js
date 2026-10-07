import { SCHEDULE, TIME } from '../../constants/index.js';

const VN_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME.VIETNAM_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Ngày hiện tại theo giờ Việt Nam, dạng YYYY-MM-DD. */
export const todayVn = (now = new Date()) => VN_DATE_FORMAT.format(now);

/** Mốc UTC của 00:00 giờ Việt Nam trong ngày YYYY-MM-DD. */
export const vnDayStart = (isoDate) => new Date(`${isoDate}T00:00:00${SCHEDULE.VIETNAM_OFFSET}`);

/** Cộng số ngày vào chuỗi YYYY-MM-DD (không phụ thuộc múi giờ máy chủ). */
export const addDays = (isoDate, days) =>
  new Date(vnDayStart(isoDate).getTime() + days * TIME.MS_PER_DAY).toLocaleDateString('en-CA', {
    timeZone: TIME.VIETNAM_ZONE,
  });

/**
 * Khoảng [start, end) theo giờ Việt Nam cho các ngày from..to (gồm cả ngày `to`).
 * @param {string} from YYYY-MM-DD
 * @param {string} to YYYY-MM-DD
 */
export const vnRange = (from, to) => ({ start: vnDayStart(from), end: vnDayStart(addDays(to, 1)) });
