import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './session-feedback.service.js';
const context = (req) => ({ user: req.user, permissions: req.permissions });
/** HLV xem nhận xét từng học viên trong buổi phụ trách. */
export const session = async (req, res) =>
  sendSuccess(res, { data: await service.listForSession(req.validated.params.id, context(req)) });
/** Ghi chú/đánh giá không làm thay đổi kết quả điểm danh. */
export const save = async (req, res) =>
  sendSuccess(res, {
    data: await service.save(
      req.validated.params.id,
      req.validated.params.memberId,
      req.validated.body,
      context(req),
    ),
  });
/** Nhật ký nhận xét của chính học viên. */
export const own = async (req, res) => {
  const { items, meta } = await service.listOwn(req.user.id, req.validated.query);
  sendSuccess(res, { data: items, meta });
};
/** Mô tả nội dung từng buổi. */
export const description = async (req, res) =>
  sendSuccess(res, {
    data: await service.updateDescription(
      req.validated.params.id,
      req.validated.body.description,
      context(req),
    ),
  });
