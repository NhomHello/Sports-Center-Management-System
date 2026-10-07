import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

const VIETNAM_COUNTRY_CODE_LENGTH = 3;

/** Chuẩn hoá số điện thoại Việt Nam về đầu 0 để kiểm tra duy nhất nhất quán. */
export const normalizePhone = (value) => {
  const compact = value.replace(/[\s.-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(VIETNAM_COUNTRY_CODE_LENGTH)}` : compact;
};

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Email không hợp lệ'));

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .pipe(z.string().regex(VALIDATION.PHONE_REGEX, 'Số điện thoại không hợp lệ'));
