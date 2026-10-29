import { ApiError } from '../../common/errors/api-error.js';
import { SETTING_KEYS as K } from '@scms/shared';
import { getValue } from '../setting/setting.service.js';
import { TIME } from '../../constants/index.js';
import { vietnamDate } from '../../common/utils/vietnam-date.js';
const WEEK_DAYS = 7;
const MONTHS_IN_QUARTER = 3;
const MONTHS_IN_YEAR = 12;
const PAD_LENGTH = 2;
const DATE_LENGTH = 10;
const YEAR_LENGTH = 4;
const pad = (n) => String(n).padStart(PAD_LENGTH, '0');
const day = (value) => new Date(`${value}T00:00:00Z`);

/** Khoá kỳ theo ngày Việt Nam; thứ Hai đầu tuần có thể thuộc năm trước. */
export const periodKey = (value, group = 'day') => {
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) ? value : vietnamDate(value);
  const d = day(date);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const monday = new Date(d.getTime() - ((d.getUTCDay() + WEEK_DAYS - 1) % WEEK_DAYS) * TIME.MS_PER_DAY);
  const keys = { day: date, week: monday.toISOString().slice(0, DATE_LENGTH), month: `${year}-${pad(month + 1)}`,
    quarter: `${year}-Q${Math.floor(month / MONTHS_IN_QUARTER) + 1}`, year: String(year) };
  return keys[group];
};

/** Biên truy vấn luôn UTC của ngày lịch Việt Nam; to là ngày bao gồm. */
export const reportRange = (query) => ({ gte: new Date(`${query.from}T00:00:00+07:00`),
  lt: new Date(new Date(`${query.to}T00:00:00+07:00`).getTime() + TIME.MS_PER_DAY) });

/** Giới hạn động theo nhóm, kiểm tra ở service cho cả dashboard và xuất. */
export const assertReportRange = async (query) => {
  const limits = await getValue(K.REPORT_MAX_DAYS_BY_GROUP);
  const length = (day(query.to) - day(query.from)) / TIME.MS_PER_DAY + 1;
  const max = limits[query.groupBy ?? 'day'];
  if (!Number.isInteger(max) || max <= 0) throw ApiError.businessRule('Cấu hình khoảng báo cáo không hợp lệ');
  if (length > max) throw ApiError.badRequest(`Khoảng báo cáo tối đa ${max} ngày cho nhóm đã chọn`);
};

/** Kỳ so sánh liền trước có cùng số ngày, kể cả khoảng qua tháng/năm nhuận. */
export const previousRange = (query) => {
  const length = day(query.to) - day(query.from) + TIME.MS_PER_DAY;
  return { ...query, from: new Date(day(query.from).getTime() - length).toISOString().slice(0, DATE_LENGTH),
    to: new Date(day(query.from).getTime() - TIME.MS_PER_DAY).toISOString().slice(0, DATE_LENGTH), compare: undefined };
};

/** Các kỳ được lấp 0 để biểu đồ không giấu kỳ không có giao dịch. */
export const periodKeys = (query) => {
  const keys = new Set();
  for (let d = day(query.from); d <= day(query.to); d = new Date(d.getTime() + TIME.MS_PER_DAY)) keys.add(periodKey(d.toISOString().slice(0, DATE_LENGTH), query.groupBy));
  return [...keys];
};

/** Biên kỳ dùng cho đếm membership hiệu lực, cắt theo khoảng lọc. */
export const bucketRanges = (query) => periodKeys(query).map((key) => {
  const group = query.groupBy ?? 'day';
  const makeStart = {
    day: () => key, week: () => key, month: () => `${key}-01`,
    quarter: () => `${key.slice(0, YEAR_LENGTH)}-${pad((Number(key.at(-1)) - 1) * MONTHS_IN_QUARTER + 1)}-01`,
    year: () => `${key}-01-01`,
  };
  const natural = new Date(`${makeStart[group]()}T00:00:00+07:00`);
  const end = nextPeriod(natural, group);
  const range = reportRange(query);
  return { key, start: new Date(Math.max(natural.getTime(), range.gte.getTime())), end: new Date(Math.min(end.getTime(), range.lt.getTime())) };
});
function nextPeriod(start, group) {
  if (group === 'day' || group === 'week') return new Date(start.getTime() + (group === 'week' ? WEEK_DAYS : 1) * TIME.MS_PER_DAY);
  const d = day(vietnamDate(start));
  const months = { month: 1, quarter: MONTHS_IN_QUARTER, year: MONTHS_IN_YEAR };
  d.setUTCMonth(d.getUTCMonth() + months[group]);
  return new Date(`${d.toISOString().slice(0, DATE_LENGTH)}T00:00:00+07:00`);
}
