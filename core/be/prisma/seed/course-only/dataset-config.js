import { TIME } from '../../../src/constants/index.js';
import { vietnamDate, vietnamDay } from '../../../src/common/utils/vietnam-date.js';

export const DATASET = Object.freeze({
  HISTORY_MONTHS: 12,
  LESSON_DAYS: [5, 12, 19, 26],
  LESSON_COUNT: 4,
  HISTORY_PRICE: 900000,
  OPEN_PRICE: 1200000,
  ADVANCED_PRICE: 1600000,
  OPEN_CAPACITY: 2,
  ADVANCED_CAPACITY: 12,
  HISTORY_CAPACITY: 15,
  INITIAL_DELAY_DAYS: 7,
  WEEK_DAYS: 7,
  DATE_LENGTH: 10,
  TX_TIMEOUT_MS: 120000,
  MAX_WAIT_MS: 30000,
});
const pad = (number) => String(number).padStart(2, '0');
/** Chuyển lịch mẫu thành timestamp Việt Nam, không phụ thuộc timezone máy chạy. */
export const lessonAt = (date, hour) => new Date(`${date}T${pad(hour)}:00:00+07:00`);
/** Ngày Việt Nam cách ngày mốc một số ngày lịch. */
export const dateAfter = (now, days) =>
  vietnamDate(new Date(vietnamDay(now).getTime() + days * TIME.MS_PER_DAY));

/** 12 khoá lịch sử + nháp gần đây/quá hạn + 2 khóa tương lai không trùng giờ của HLV. */
export const courseTemplates = (now) => {
  const month = new Date(`${vietnamDate(now).slice(0, 7)}-01T00:00:00Z`);
  const history = Array.from({ length: DATASET.HISTORY_MONTHS }, (_, index) => {
    const start = new Date(month);
    start.setUTCMonth(start.getUTCMonth() - (DATASET.HISTORY_MONTHS - index));
    const tag = start.toISOString().slice(0, 7);
    return {
      tag,
      name: `Fitness nền tảng · ${tag}`,
      price: DATASET.HISTORY_PRICE,
      mode: 'published',
      hour: 18,
      dates: DATASET.LESSON_DAYS.map((day) => `${tag}-${pad(day)}`),
    };
  });
  const recent = [
    { tag: 'recent', name: 'Fitness · chờ HLV công bố', mode: 'draft', endDays: -2, hour: 10 },
    { tag: 'overdue', name: 'Fitness · quá hạn tổng kết', mode: 'draft', endDays: -10, hour: 14 },
  ].map(({ endDays, ...item }) => ({
    ...item,
    price: DATASET.HISTORY_PRICE,
    dates: Array.from({ length: DATASET.LESSON_COUNT }, (_, i) =>
      dateAfter(now, endDays - DATASET.LESSON_COUNT + 1 + i),
    ),
  }));
  const upcoming = [
    {
      tag: 'open',
      name: 'Fitness nền tảng · đang nhận đăng ký',
      price: DATASET.OPEN_PRICE,
      capacity: DATASET.OPEN_CAPACITY,
      offset: 0,
    },
    {
      tag: 'advanced',
      name: 'Fitness nâng cao · đang nhận đăng ký',
      price: DATASET.ADVANCED_PRICE,
      capacity: DATASET.ADVANCED_CAPACITY,
      offset: 1,
    },
  ].map(({ offset, ...item }) => ({
    ...item,
    mode: 'open',
    hour: 18,
    dates: Array.from({ length: DATASET.LESSON_COUNT }, (_, i) =>
      dateAfter(now, DATASET.INITIAL_DELAY_DAYS + offset + i * DATASET.WEEK_DAYS),
    ),
  }));
  return [...history, ...recent, ...upcoming];
};
