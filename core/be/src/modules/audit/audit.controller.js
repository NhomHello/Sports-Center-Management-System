import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './audit.service.js';

/** GET /audit-logs: chỉ trả trường công khai của người thực hiện. */
export const list = async (req, res) => {
  const { items, meta } = await service.list(req.validated.query);
  sendSuccess(res, { data: items, meta });
};
