import { createHash, timingSafeEqual } from 'node:crypto';
import { StatusCodes } from 'http-status-codes';
import { ERROR_CODES } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { env } from '../../config/env.js';
import { AUTH, SEPAY } from '../../constants/index.js';

// So sánh hash cùng độ dài để timingSafeEqual không lộ độ dài key qua thời gian xử lý.
const digest = (value) => createHash('sha256').update(value).digest();

/** Xác thực webhook SePay bằng header `Authorization: Apikey <key>`. */
export const authenticateSepay = (req, _res, next) => {
  if (!env.SEPAY_WEBHOOK_API_KEY) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      ERROR_CODES.INTERNAL_ERROR,
      'Chưa cấu hình nhận thanh toán SePay',
    );
  }
  const header = req.get(AUTH.HEADER) ?? '';
  const prefix = `${SEPAY.AUTH_SCHEME} `;
  const provided = header.startsWith(prefix) ? header.slice(prefix.length) : '';
  if (!timingSafeEqual(digest(provided), digest(env.SEPAY_WEBHOOK_API_KEY))) {
    throw ApiError.unauthorized('API key webhook không hợp lệ');
  }
  next();
};
