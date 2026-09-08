import dayjs from 'dayjs';
import { DATE_FORMATS, DEFAULT_CURRENCY } from '@/constants';

const LOCALE = 'vi-VN';

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

/** @param {string | Date | null | undefined} value */
export const formatDateTime = (value) => formatDate(value, DATE_FORMATS.DATE_TIME);
