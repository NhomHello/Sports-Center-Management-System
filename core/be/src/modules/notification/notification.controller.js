import { sendSuccess } from '../../common/utils/api-response.js';
import * as notificationService from './notification.service.js';

/** GET /notifications */
export const list = async (req, res) => {
  const { items, meta } = await notificationService.listForUser(req.user.id, req.validated.query);
  sendSuccess(res, { data: items, meta });
};

/** PATCH /notifications/:id/read */
export const markRead = async (req, res) => {
  const data = await notificationService.markRead(req.validated.params.id, req.user.id);
  sendSuccess(res, { data, message: 'Đã đánh dấu đã đọc' });
};

/** PATCH /notifications/read */
export const markManyRead = async (req, res) => {
  const data = await notificationService.markManyRead(req.validated.body.ids, req.user.id);
  sendSuccess(res, { data, message: 'Đã đánh dấu các thông báo là đã đọc' });
};
