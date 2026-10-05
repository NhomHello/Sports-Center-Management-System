import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as userService from './user.service.js';

/** GET /users */
export const list = async (req, res) => {
  const { items, meta } = await userService.list(req.validated.query);
  sendSuccess(res, { data: items, meta });
};

/** GET /users/:id */
export const getById = async (req, res) => {
  const user = await userService.getById(req.validated.params.id);
  sendSuccess(res, { data: user });
};

/** POST /users */
export const create = async (req, res) => {
  const user = await userService.create(req.validated.body, req.user);
  sendCreated(res, user, 'Tạo tài khoản thành công');
};

/** PATCH /users/:id/role */
export const updateRole = async (req, res) => {
  const user = await userService.updateRole(
    req.validated.params.id,
    req.validated.body.roleId,
    req.user,
  );
  sendSuccess(res, { data: user, message: 'Cập nhật vai trò thành công' });
};

/** PATCH /users/:id/status */
export const updateStatus = async (req, res) => {
  const user = await userService.updateStatus(
    req.validated.params.id,
    req.validated.body.status,
    req.user,
  );
  sendSuccess(res, {
    data: user,
    message: user.status === 'ACTIVE' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
  });
};
