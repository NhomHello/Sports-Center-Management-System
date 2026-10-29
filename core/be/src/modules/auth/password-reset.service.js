import { SETTING_KEYS } from '@scms/shared';
import { buildPasswordResetEmail } from '../../common/mail/mail-templates.js';
import { sendMail } from '../../common/mail/mailer.js';
import { hashPassword } from '../../common/utils/password.js';
import { Enums, prisma } from '../../config/db.js';
import { loginKey } from './login-lock.service.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, ENTITIES, PASSWORD_RESET } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import {
  buildLink,
  claimToken,
  findUsableToken,
  isInCooldown,
  issueToken,
} from './email-token.service.js';

const { RESET_PASSWORD } = Enums.EmailTokenPurpose;

const sendResetEmail = async (user) => {
  if (!user.email || user.status !== Enums.UserStatus.ACTIVE) return;
  if (await isInCooldown(user.id, RESET_PASSWORD)) return;
  const { token, ttlMinutes } = await issueToken({
    userId: user.id,
    email: user.email,
    purpose: RESET_PASSWORD,
    ttlSettingKey: SETTING_KEYS.PASSWORD_RESET_TTL_MINUTES,
  });
  const centerName = await settingService.getValue(SETTING_KEYS.CENTER_NAME);
  await sendMail({
    to: user.email,
    ...buildPasswordResetEmail({
      fullName: user.fullName,
      link: buildLink(PASSWORD_RESET.RESET_PATH, token),
      ttlMinutes,
      centerName,
    }),
  });
};

/**
 * Quên mật khẩu: gửi link đặt lại tới email. Luôn thành công với caller để không lộ
 * email nào đã đăng ký; lỗi gửi mail chỉ ghi log.
 * @param {{ email: string }} data
 */
export const requestPasswordReset = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  try {
    await sendResetEmail(user);
  } catch (err) {
    logger.error({ err, userId: user.id }, 'Gửi email đặt lại mật khẩu thất bại');
  }
};

/**
 * Đặt mật khẩu mới bằng token. Thu hồi mọi phiên đang đăng nhập (tokenVersion) và, vì người dùng
 * vừa chứng minh sở hữu hộp thư, coi email là đã xác minh để họ đăng nhập được ngay.
 * @param {{ token: string, password: string }} data
 */
export const confirmPasswordReset = async ({ token, password }) => {
  const record = await findUsableToken(token, [RESET_PASSWORD]);
  const passwordHash = await hashPassword(password);
  const usedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await claimToken(tx, record, usedAt);
    await tx.loginThrottle.updateMany({
      where: { key: loginKey(record.user) },
      data: { attempts: 0, lockedUntil: null },
    });
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
        ...(record.user.email === record.email &&
          !record.user.emailVerifiedAt && {
            emailVerifiedAt: usedAt,
          }),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: record.userId,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.USER,
        entityId: String(record.userId),
        meta: { passwordReset: true, sessionsRevoked: true },
      },
    });
  });
};
