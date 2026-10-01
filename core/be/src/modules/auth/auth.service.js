import { ERROR_CODES } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { ensureUniqueContacts } from '../../common/utils/account-contacts.js';
import { signAccessToken } from '../../common/utils/jwt.js';
import { comparePassword, hashPassword } from '../../common/utils/password.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import * as permissionService from '../permission/permission.service.js';
import { USER_WITH_ROLE, toPublicUser } from '../user/user.mapper.js';

/**
 * Đăng nhập bằng email hoặc số điện thoại và mật khẩu.
 * @param {{ email: string, password: string }} credentials
 * @param {{ ip?: string }} [context]
 * @returns {Promise<{ accessToken: string, user: object }>}
 */
export const login = async ({ email, password }, { ip } = {}) => {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone: email }] },
    include: USER_WITH_ROLE,
  });
  const passwordOk = user && (await comparePassword(password, user.passwordHash));
  if (!passwordOk) {
    throw ApiError.unauthorized(
      'Email, số điện thoại hoặc mật khẩu không đúng',
      ERROR_CODES.INVALID_CREDENTIALS,
    );
  }
  if (user.status !== Enums.UserStatus.ACTIVE) {
    throw ApiError.forbidden('Tài khoản đã bị khoá', ERROR_CODES.ACCOUNT_INACTIVE);
  }

  const accessToken = signAccessToken({ sub: user.id, version: user.tokenVersion });
  recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.LOGIN,
    entity: ENTITIES.USER,
    entityId: user.id,
    ip,
  });
  return { accessToken, user: toPublicUser(user) };
};

/**
 * Tu dang ky tai khoan online. Role lay tu Role.isDefault (cau hinh trong DB, khong hardcode).
 * @param {{ email: string, password: string, fullName: string, phone?: string }} data
 * @returns {Promise<object>} user public
 */
export const register = async ({ password, ...data }) => {
  await ensureUniqueContacts(data);
  const defaultRole = await prisma.role.findFirst({ where: { isDefault: true } });
  if (!defaultRole) {
    throw ApiError.businessRule('Hệ thống chưa cấu hình vai trò mặc định cho đăng ký');
  }

  const user = await prisma.user.create({
    data: { ...data, passwordHash: await hashPassword(password), roleId: defaultRole.id },
    include: USER_WITH_ROLE,
  });
  recordAudit({
    userId: user.id,
    action: AUDIT_ACTIONS.REGISTER,
    entity: ENTITIES.USER,
    entityId: user.id,
  });
  return toPublicUser(user);
};

/**
 * Thong tin user hien tai + danh sach permission (FE dung de an/hien menu, nut).
 * @param {number} userId
 * @returns {Promise<{ user: object, permissions: string[] }>}
 */
export const getMe = async (userId) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: USER_WITH_ROLE,
  });
  const permissions = await permissionService.getCodesByRoleId(user.roleId);
  return { user: toPublicUser(user), permissions: [...permissions] };
};

/** UC-UM-13: xác minh mật khẩu cũ, thu hồi mọi token cũ và audit trong transaction. */
export const changePassword = async (userId, { currentPassword, password }) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw ApiError.businessRule('Mật khẩu hiện tại không đúng', [
      { field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' },
    ]);
  }
  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    const changed = await tx.user.updateMany({
      where: { id: userId, tokenVersion: user.tokenVersion },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    if (changed.count !== 1)
      throw ApiError.conflict('Mật khẩu đã được thay đổi ở phiên khác. Vui lòng đăng nhập lại.');
    await tx.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.USER,
        entityId: String(userId),
        meta: { passwordChanged: true, sessionsRevoked: true },
      },
    });
  });
  return { requiresLogin: true };
};
