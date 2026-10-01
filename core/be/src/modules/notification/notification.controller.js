import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './notification.service.js';

/** GET /notifications */
export const list = async (req, res) => {
  const { items, meta } = await service.listForUser(req.user.id, req.validated.query);
  sendSuccess(res, { data: items, meta });
};

/** PATCH /notifications/:id/read */
export const markRead = async (req, res) =>
  sendSuccess(res, {
    data: await service.markRead(req.validated.params.id, req.user.id),
    message: 'Đã đánh dấu thông báo đã đọc',
  });
