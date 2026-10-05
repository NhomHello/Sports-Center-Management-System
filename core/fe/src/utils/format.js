import dayjs from 'dayjs';
import { DATE_FORMATS, DEFAULT_CURRENCY, VIETNAM_TIME_ZONE } from '@/constants';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

const LOCALE = 'vi-VN';
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 1500000 -> "1.500.000 ₫"
 * @param {number} amount
 * @param {string} [currency]
 */
export const formatCurrency = (amount, currency = DEFAULT_CURRENCY) =>
  new Intl.NumberFormat(LOCALE, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amount ?? 0,
  );

/**
 * @param {string | Date | null | undefined} value
 * @param {string} [pattern]
 */
export const formatDate = (value, pattern = DATE_FORMATS.DATE) =>
  value ? dayjs(value).format(pattern) : '';

/** Hiển thị mốc thời gian theo múi giờ Việt Nam, không phụ thuộc máy người xem. */
export const formatDateTime = (value) =>
  value ? dayjs(value).tz(VIETNAM_TIME_ZONE).format(DATE_FORMATS.DATE_TIME) : '';
