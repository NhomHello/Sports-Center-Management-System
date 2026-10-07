import { createHash, randomBytes } from 'node:crypto';
import { ERROR_CODES, SETTING_KEYS } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../common/errors/api-error.js';
import { buildVerificationEmail } from '../../common/mail/mail-templates.js';
import { sendMail } from '../../common/mail/mailer.js';
import { recordAudit } from '../../common/utils/audit.js';
import { Enums, prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, EMAIL_VERIFICATION, ENTITIES, TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const invalidTokenError = () =>
  new ApiError(
    StatusCodes.BAD_REQUEST,
    ERROR_CODES.VERIFICATION_TOKEN_INVALID,
    'Liên kết xác minh không hợp lệ hoặc đã hết hạn',
  );

/** Còn trong thời gian chờ giữa hai lần gửi? Chống spam hộp thư của người khác. */
const isInCooldown = async (userId, cooldownSeconds) => {
  if (cooldownSeconds <= 0) return false;
  const latest = await prisma.emailVerificationToken.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  return (
    Boolean(latest) &&
    Date.now() - latest.createdAt.getTime() < cooldownSeconds * TIME.MS_PER_SECOND
  );
};

/**
 * Tạo token mới (thu hồi token chưa dùng trước đó) rồi gửi email xác minh.
 * Chỉ gửi khi user có email, đang ACTIVE, chưa xác minh và không ở trong thời gian chờ.
 * @param {{ id: number, email: string|null, fullName: string, status: string, emailVerifiedAt: Date|null }} user
 * @returns {Promise<boolean>} true nếu đã phát hành token và gọi gửi mail
 */
export const sendVerificationEmail = async (user) => {
  if (!user.email || user.emailVerifiedAt || user.status !== Enums.UserStatus.ACTIVE) return false;
  const [ttlMinutes, cooldownSeconds, centerName] = await Promise.all([
    settingService.getValue(SETTING_KEYS.EMAIL_VERIFICATION_TTL_MINUTES),
    settingService.getValue(SETTING_KEYS.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS),
    settingService.getValue(SETTING_KEYS.CENTER_NAME),
  ]);
  if (await isInCooldown(user.id, cooldownSeconds)) return false;

  const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString('hex');
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + ttlMinutes * TIME.MS_PER_MINUTE),
      },
    }),
  ]);

  const link = new URL(EMAIL_VERIFICATION.VERIFY_PATH, env.APP_BASE_URL);
  link.searchParams.set('token', token);
  await sendMail({
    to: user.email,
    ...buildVerificationEmail({
      fullName: user.fullName,
      link: link.toString(),
      ttlMinutes,
      centerName,
    }),
  });
  return true;
};

/**
 * Gửi email xác minh mà không làm hỏng luồng gọi (đăng ký vẫn thành công khi SMTP lỗi;
 * người dùng bấm "gửi lại" sau).
 * @param {Parameters<typeof sendVerificationEmail>[0]} user
 */
export const trySendVerificationEmail = async (user) => {
  try {
    await sendVerificationEmail(user);
  } catch (err) {
    logger.error({ err, userId: user.id }, 'Gửi email xác minh thất bại');
  }
};

/**
 * Gửi lại email xác minh. Luôn thành công với caller để không lộ email nào đã đăng ký.
 * @param {{ email: string }} data
 */
export const requestVerification = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) await trySendVerificationEmail(user);
};

/**
 * Xác minh email bằng token: token phải đúng, chưa dùng, chưa hết hạn và email của tài khoản
 * chưa bị đổi từ lúc gửi. Dùng một lần (updateMany có điều kiện usedAt = null chặn gọi song song).
 * @param {{ token: string }} data
 * @returns {Promise<{ verifiedAt: Date }>}
 */
export const confirmVerification = async ({ token }) => {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (
    !record ||
    record.usedAt ||
    record.expiresAt <= new Date() ||
    record.user.email !== record.email
  ) {
    throw invalidTokenError();
  }

  const verifiedAt = new Date();
  await prisma.$transaction(async (tx) => {
    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: verifiedAt },
    });
    if (claimed.count !== 1) throw invalidTokenError();
    await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: verifiedAt } });
  });
  recordAudit({
    userId: record.userId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.USER,
    entityId: record.userId,
    meta: { emailVerified: true },
  });
  return { verifiedAt };
};
