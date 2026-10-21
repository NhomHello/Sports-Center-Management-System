import { createHash, randomBytes } from 'node:crypto';
import { ERROR_CODES, SETTING_KEYS } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { EMAIL_VERIFICATION, TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';

/** Token chỉ lưu hash; người nhận giữ bản thô trong link email. */
export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/** Lỗi chung cho token sai, đã dùng hoặc hết hạn (không tiết lộ lý do cụ thể). */
export const invalidTokenError = () =>
  new ApiError(
    StatusCodes.BAD_REQUEST,
    ERROR_CODES.VERIFICATION_TOKEN_INVALID,
    'Liên kết không hợp lệ hoặc đã hết hạn',
  );

/** Còn trong thời gian chờ giữa hai lần gửi? Chống spam hộp thư của người khác. */
export const isInCooldown = async (userId, purpose) => {
  const cooldownSeconds = await settingService.getValue(
    SETTING_KEYS.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  );
  if (cooldownSeconds <= 0) return false;
  const latest = await prisma.emailVerificationToken.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return (
    Boolean(latest) &&
    Date.now() - latest.createdAt.getTime() < cooldownSeconds * TIME.MS_PER_SECOND
  );
};

/**
 * Phát hành token mới và thu hồi token chưa dùng cùng mục đích của user.
 * @param {{ userId: number, email: string, purpose: string, ttlSettingKey: string }} options
 * @returns {Promise<{ token: string, ttlMinutes: number }>} token thô để đưa vào link
 */
export const issueToken = async ({ userId, email, purpose, ttlSettingKey }) => {
  const ttlMinutes = await settingService.getValue(ttlSettingKey);
  const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString('hex');
  // InnoDB có thể deadlock khi nhiều test/luồng ghi token đồng thời.
  // Prisma P2034 là lỗi transaction có thể thử lại, không phải lỗi token.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await prisma.$transaction(
        [
          prisma.emailVerificationToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
          prisma.emailVerificationToken.create({
            data: {
              userId,
              email,
              purpose,
              tokenHash: hashToken(token),
              expiresAt: new Date(Date.now() + ttlMinutes * TIME.MS_PER_MINUTE),
            },
          }),
        ],
        { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
      );
      break;
    } catch (error) {
      if (error.code !== 'P2034' || attempt === MAX_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 40));
    }
  }
  return { token, ttlMinutes };
};

/** Link tuyệt đối tới trang FE nhận token. */
export const buildLink = (path, token) => {
  const link = new URL(path, env.APP_BASE_URL);
  link.searchParams.set('token', token);
  return link.toString();
};

/**
 * Tìm token còn dùng được (đúng mục đích, chưa dùng, chưa hết hạn).
 * @param {string} token
 * @param {string[]} purposes
 */
export const findUsableToken = async (token, purposes) => {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) throw invalidTokenError();
  if (!purposes.includes(record.purpose)) throw invalidTokenError();
  return record;
};

/** Đánh dấu đã dùng; updateMany có điều kiện usedAt = null chặn hai request song song. */
export const claimToken = async (tx, record, usedAt) => {
  const claimed = await tx.emailVerificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt },
  });
  if (claimed.count !== 1) throw invalidTokenError();
};
