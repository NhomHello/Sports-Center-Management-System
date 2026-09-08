import { sendCreated, sendNoContent, sendSuccess } from '../../common/utils/api-response.js';
import * as roleService from './role.service.js';

/** GET /roles */
export const list = async (_req, res) => {
  const data = await roleService.list();
  sendSuccess(res, { data });
};

/** GET /roles/:id */
export const getById = async (req, res) => {
  const data = await roleService.getById(req.validated.params.id);
  sendSuccess(res, { data });
};

/** POST /roles */
export const create = async (req, res) => {
  const data = await roleService.create(req.validated.body, req.user);
  sendCreated(res, data, 'Tạo vai trò thành công');
};

/** PUT /roles/:id */
export const update = async (req, res) => {
  const data = await roleService.update(req.validated.params.id, req.validated.body, req.user);
  sendSuccess(res, { data, message: 'Cập nhật vai trò thành công' });
};

/** DELETE /roles/:id */
export const remove = async (req, res) => {
  await roleService.remove(req.validated.params.id, req.user);
  sendNoContent(res);
};

/** PATCH /roles/:id/default */
export const setDefault = async (req, res) => {
  const data = await roleService.setDefault(req.validated.params.id, req.user);
  sendSuccess(res, { data, message: 'Đã đặt làm vai trò mặc định' });
};
