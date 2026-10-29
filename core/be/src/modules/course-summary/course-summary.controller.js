import { sendSuccess, sendCreated } from '../../common/utils/api-response.js';
import * as summaries from './course-summary.service.js';
import * as results from './course-result.service.js';
import * as ratings from './course-rating.service.js';
import { courseReport, courseReportExcel } from './course-report.service.js';
const context = (req) => ({ user: req.user, permissions: req.permissions });
/** Tổng kết lớp trong phạm vi quyền. */
export const get = async (req, res) => sendSuccess(res, { data: await summaries.getSummary(req.validated.params.id, context(req)) });
/** Lưu nháp một học viên. */
export const update = async (req, res) => sendSuccess(res, { data: await summaries.updateItem(req.validated.params.id, req.validated.params.itemId, req.validated.body, context(req)) });
/** Công bố snapshot và outbox. */
export const publish = async (req, res) => sendSuccess(res, { data: await summaries.publish(req.validated.params.id, req.validated.body, context(req)) });
/** Quản lý mở lại kèm lý do. */
export const reopen = async (req, res) => sendSuccess(res, { data: await summaries.reopen(req.validated.params.id, req.validated.body.reason, req.user) });
/** Kết quả của chủ token. */
export const listResults = async (req, res) => {
  const { items, meta } = await results.listResults(req.user.id, req.validated.query);
  sendSuccess(res, { data: items, meta });
};
/** Phiếu tổng kết PDF. */
export const pdf = async (req, res) => {
  const file = await results.resultPdf(req.validated.params.id, req.user.id);
  res.type('application/pdf').attachment(file.filename).send(file.buffer);
};
/** Tạo đánh giá của mình. */
export const createRating = async (req, res) => sendCreated(res, await ratings.saveRating(req.validated.params.id, req.validated.body, req.user, false));
/** Sửa đánh giá của mình. */
export const updateRating = async (req, res) => sendSuccess(res, { data: await ratings.saveRating(req.validated.params.id, req.validated.body, req.user, true) });
/** Nhận xét ẩn danh, danh tính chỉ theo quyền moderation. */
export const listRatings = async (req, res) => {
  const { items, meta, averages } = await ratings.listRatings(req.validated.params.id, req.validated.query, context(req));
  sendSuccess(res, { data: items, meta: { ...meta, averages } });
};
/** Ẩn/hiện nhận xét có audit. */
export const moderate = async (req, res) => sendSuccess(res, { data: await ratings.moderate(req.validated.params.id, req.validated.body, req.user) });
/** Báo cáo tổng kết theo quyền riêng. */
export const report = async (req, res) => sendSuccess(res, { data: await courseReport(req.validated.query) });
/** Excel dùng cùng builder báo cáo. */
export const exportExcel = async (req, res) => res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').attachment('course-summaries.xlsx').send(await courseReportExcel(req.validated.query));
