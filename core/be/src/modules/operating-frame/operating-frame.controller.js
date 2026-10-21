import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as service from './operating-frame.service.js';

/** GET /operating-frames */
export const list = async (_req, res) => sendSuccess(res, { data: await service.list() });

/** POST /operating-frames */
export const create = async (req, res) =>
  sendCreated(res, await service.create(req.validated.body, req.user), 'Đã thêm khung giờ');

/** PUT /operating-frames/:id */
export const update = async (req, res) =>
  sendSuccess(res, {
    data: await service.update(req.validated.params.id, req.validated.body, req.user),
    message: 'Đã cập nhật khung giờ',
  });
