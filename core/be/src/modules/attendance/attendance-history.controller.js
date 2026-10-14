import { sendSuccess } from '../../common/utils/api-response.js';
import { listOwn } from './attendance-history.service.js';
/** Lịch sử chính chủ lấy memberId từ JWT. */
export const ownHistory = async (req, res) => {
  const { items, meta } = await listOwn(req.user.id, req.validated.query);
  sendSuccess(res, { data: items, meta });
};
