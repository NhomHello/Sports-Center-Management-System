import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as service from './room-type.service.js';

/** GET /room-types */
export const list = async (_req, res) => sendSuccess(res, { data: await service.list() });

/** POST /room-types */
export const create = async (req, res) =>
  sendCreated(res, await service.create(req.validated.body, req.user), 'Đã thêm loại phòng');

/** PUT /room-types/:id */
export const update = async (req, res) =>
  sendSuccess(res, {
    data: await service.update(req.validated.params.id, req.validated.body, req.user),
    message: 'Đã cập nhật loại phòng',
  });
