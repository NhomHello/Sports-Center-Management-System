import { sendSuccess } from '../../common/utils/api-response.js';
import * as settingService from './setting.service.js';

/** GET /settings */
export const list = async (_req, res) => {
  const data = await settingService.listGrouped();
  sendSuccess(res, { data });
};

/** PUT /settings */
export const updateMany = async (req, res) => {
  const data = await settingService.updateMany(req.validated.body.items, req.user);
  sendSuccess(res, { data, message: 'Cập nhật cấu hình thành công' });
};
