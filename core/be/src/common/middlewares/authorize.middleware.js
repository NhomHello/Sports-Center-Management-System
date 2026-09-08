import * as permissionService from '../../modules/permission/permission.service.js';
import { ApiError } from '../errors/api-error.js';

/**
 * Middleware phan quyen DYNAMIC: cho qua neu user co IT NHAT MOT permission trong danh sach.
 * Quyen duoc doc tu DB theo role cua user (co cache ngan), nen Center Manager doi quyen
 * tren UI la co hieu luc ngay, khong can dang nhap lai.
 *
 * Dung: router.post('/', authenticate, authorize(PERMISSIONS.ROLE_CREATE), controller.create)
 * KHONG BAO GIO viet: if (req.user.role === 'ADMIN')
 *
 * @param {...string} requiredCodes permission code (PERMISSIONS.*)
 * @returns {import('express').RequestHandler}
 */
export const authorize =
  (...requiredCodes) =>
  async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();

    const granted = await permissionService.getCodesByRoleId(req.user.roleId);
    const allowed = requiredCodes.some((code) => granted.has(code));
    if (!allowed) throw ApiError.forbidden();

    req.permissions = granted;
    next();
  };
