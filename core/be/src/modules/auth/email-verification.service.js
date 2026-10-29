import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { buildEmailChangeEmail, buildVerificationEmail } from '../../common/mail/mail-templates.js';
import { sendMail } from '../../common/mail/mailer.js';
import { recordAudit } from '../../common/utils/audit.js';
import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, EMAIL_VERIFICATION, ENTITIES } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import {
  buildLink,
  claimToken,
  findUsableToken,
  invalidTokenError,
  isInCooldown,
  issueToken,
} from './email-token.service.js';

const { VERIFY_EMAIL, CHANGE_EMAIL } = Enums.EmailTokenPurpose;

/**
 * Tạo token xác minh rồi gửi email. Chỉ gửi khi user có email, đang ACTIVE, chưa xác minh
 * và không ở trong thời gian chờ.
 * @param {{ id: number, email: string|null, fullName: string, status: string, emailVerifiedAt: Date|null }} user
 * @returns {Promise<boolean>} true nếu đã phát hành token và gọi gửi mail
 */
export const sendVerificationEmail = async (user) => {
  if (!user.email || user.emailVerifiedAt || user.status !== Enums.UserStatus.ACTIVE) return false;
  if (await isInCooldown(user.id, VERIFY_EMAIL)) return false;
  const { token, ttlMinutes } = await issueToken({
    userId: user.id,
    email: user.email,
    purpose: VERIFY_EMAIL,
    ttlSettingKey: SETTING_KEYS.EMAIL_VERIFICATION_TTL_MINUTES,
  });
  const centerName = await settingService.getValue(SETTING_KEYS.CENTER_NAME);
  await sendMail({
    to: user.email,
    ...buildVerificationEmail({
      fullName: user.fullName,
      link: buildLink(EMAIL_VERIFICATION.VERIFY_PATH, token),
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
 * Yêu cầu đổi email: địa chỉ mới chỉ có hiệu lực khi người dùng bấm link gửi tới địa chỉ mới,
 * nhờ vậy gõ sai email không làm mất khả năng đăng nhập.
 * @param {{ id: number, fullName: string }} user
 * @param {string} newEmail đã kiểm tra chưa bị tài khoản khác dùng
 * @returns {Promise<boolean>} false khi đang trong thời gian chờ giữa hai lần gửi
 */
export const requestEmailChange = async (user, newEmail) => {
  if (await isInCooldown(user.id, CHANGE_EMAIL)) return false;
  const { token, ttlMinutes } = await issueToken({
    userId: user.id,
    email: newEmail,
    purpose: CHANGE_EMAIL,
    ttlSettingKey: SETTING_KEYS.EMAIL_VERIFICATION_TTL_MINUTES,
  });
  const centerName = await settingService.getValue(SETTING_KEYS.CENTER_NAME);
  await sendMail({
    to: newEmail,
    ...buildEmailChangeEmail({
      fullName: user.fullName,
      link: buildLink(EMAIL_VERIFICATION.VERIFY_PATH, token),
      ttlMinutes,
      centerName,
    }),
  });
  return true;
};

/** Email mới đang chờ xác nhận của user (null nếu không có yêu cầu còn hiệu lực). */
export const getPendingEmail = async (userId) => {
  const pending = await prisma.emailVerificationToken.findFirst({
    where: { userId, purpose: CHANGE_EMAIL, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { email: true },
  });
  return pending?.email ?? null;
};

const applyVerification = async (tx, record, verifiedAt) => {
  if (record.purpose === VERIFY_EMAIL) {
    // Email đã đổi sau khi gửi link => link cũ vô hiệu.
    if (record.user.email !== record.email) throw invalidTokenError();
    await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: verifiedAt } });
    return;
  }
  const taken = await tx.user.findFirst({
    where: { email: record.email, NOT: { id: record.userId } },
    select: { id: true },
  });
  if (taken) throw ApiError.conflict('Email này đã được tài khoản khác sử dụng');
  await tx.user.update({
    where: { id: record.userId },
    data: { email: record.email, emailVerifiedAt: verifiedAt },
  });
  await tx.emailVerificationToken.deleteMany({
    where: { userId: record.userId, purpose: CHANGE_EMAIL, usedAt: null },
  });
};

/**
 * Xác nhận token xác minh hoặc đổi email: đúng, chưa dùng, chưa hết hạn. Dùng một lần.
 * @param {{ token: string }} data
 * @returns {Promise<{ verifiedAt: Date, emailChanged: boolean }>}
 */
export const confirmVerification = async ({ token }) => {
  const record = await findUsableToken(token, [VERIFY_EMAIL, CHANGE_EMAIL]);
  const verifiedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await claimToken(tx, record, verifiedAt);
    await applyVerification(tx, record, verifiedAt);
  });
  const emailChanged = record.purpose === CHANGE_EMAIL;
  recordAudit({
    userId: record.userId,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.USER,
    entityId: record.userId,
    meta: emailChanged
      ? { emailChanged: true, before: record.user.email, after: record.email }
      : { emailVerified: true },
  });
  return { verifiedAt, emailChanged };
};
