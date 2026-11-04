import { PERMISSIONS as P } from '@scms/shared';
import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './cancellation-history.service.js';
/** Hội viên luôn đọc lịch sử của chính JWT. */
export const own = async (req, res) => {
  const { items, meta } = await service.list(req.validated.query, req.user.id);
  sendSuccess(res, { data: items, meta });
};
/** Nhân viên đọc theo quyền, có thể lọc một hội viên. */
export const list = async (req, res) => {
  const { items, meta } = await service.list(req.validated.query, req.validated.query.memberId);
  sendSuccess(res, { data: items, meta });
};
/** Chi tiết vẫn áp dụng phạm vi chính chủ nếu không có quyền xem toàn bộ. */
export const detail = async (req, res) => {
  const staff =
    req.permissions.has(P.INVOICE_READ_ALL) || req.permissions.has(P.CLASS_ENROLL_FOR_MEMBER);
  sendSuccess(res, {
    data: await service.getById(req.validated.params.id, staff ? undefined : req.user.id),
  });
};
