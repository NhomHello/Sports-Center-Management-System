import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './member.service.js';

/** GET /members/me */
export const getOwn = async (req, res) =>
  sendSuccess(res, { data: await service.getOwn(req.user) });

/** PATCH /members/me */
export const updateOwn = async (req, res) =>
  sendSuccess(res, {
    data: await service.updateOwn(req.user, req.validated.body),
    message: 'Cập nhật hồ sơ thành công',
  });

/** GET /members; chỉ dùng khi có member.read. */
export const list = async (req, res) => {
  const { items, meta } = await service.list(req.validated.query);
  sendSuccess(res, { data: items, meta });
};
