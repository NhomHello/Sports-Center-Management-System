import { createHash } from 'node:crypto';
import { ERROR_CODES, SETTING_KEYS as K } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import * as settings from '../setting/setting.service.js';

/** Email và SĐT của cùng tài khoản dùng chung bộ đếm; định danh lạ vẫn có cùng phản hồi. */
export const loginKey = (user, identifier) =>
  createHash('sha256')
    .update(user ? `user:${user.id}` : `unknown:${identifier.trim().toLowerCase()}`)
    .digest('hex');

/** BR-1.14: khoá hàng trước khi đếm để các lần sai song song không làm mất lượt. */
export const checkLoginAttempt = async (key, passwordOk) => {
  const [limit, minutes] = await Promise.all([
    settings.getValue(K.LOGIN_MAX_FAILED_ATTEMPTS),
    settings.getValue(K.LOGIN_LOCK_MINUTES),
  ]);
  const lockedUntil = await prisma.$transaction(
    async (tx) => {
      await tx.loginThrottle.upsert({ where: { key }, create: { key }, update: {} });
      await tx.$queryRaw`SELECT throttle_key FROM login_throttles WHERE throttle_key = ${key} FOR UPDATE`;
      const row = await tx.loginThrottle.findUniqueOrThrow({ where: { key } });
      const now = new Date();
      if (row.lockedUntil > now) return row.lockedUntil;
      const attempts = passwordOk ? 0 : (row.lockedUntil ? 0 : row.attempts) + 1;
      const until =
        attempts >= limit ? new Date(now.getTime() + minutes * TIME.MS_PER_MINUTE) : null;
      await tx.loginThrottle.update({ where: { key }, data: { attempts, lockedUntil: until } });
      return until;
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
  if (lockedUntil)
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      ERROR_CODES.LOGIN_TEMPORARILY_LOCKED,
      'Đã thử đăng nhập sai nhiều lần. Vui lòng chờ hoặc dùng Quên mật khẩu.',
      { lockedUntil: lockedUntil.toISOString() },
    );
};
