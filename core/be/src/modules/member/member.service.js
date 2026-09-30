import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';
import * as userService from '../user/user.service.js';

/**
 * Đăng ký hội viên tại quầy bằng vai trò mặc định của hệ thống.
 * @param {{ email: string, password: string, fullName: string, phone: string }} data
 * @param {{ id: number }} actor
 * @returns {Promise<object>}
 */
export const create = async (data, actor) => {
  const defaultRole = await prisma.role.findFirst({
    where: { isDefault: true },
  });

  if (!defaultRole) {
    throw ApiError.businessRule('Hệ thống chưa cấu hình vai trò mặc định cho hội viên');
  }

  return userService.create(
    {
      ...data,
      roleId: defaultRole.id,
    },
    actor,
  );
};
