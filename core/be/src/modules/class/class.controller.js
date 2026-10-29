import { previewClassUpdate } from './class-change-preview.service.js';
import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as readService from './class-read.service.js';
import * as classService from './class.service.js';
import { enrichClassView } from './class-booking-policy.service.js';
const context = (req) => ({ user: req.user, permissions: req.permissions });
/** Danh sách lớp có phạm vi xác thực. */
export const list = async (req, res) => {
  const memberId = readService.resolveBookingMember(req.validated.query, context(req));
  const result = await readService.list(req.validated.query, context(req));
  const data = await Promise.all(result.data.map((item) => enrichClassView(item, memberId)));
  sendSuccess(res, { ...result, data });
};
/** Chi tiết lớp. */
export const getById = async (req, res) => {
  const memberId = readService.resolveBookingMember(req.validated.query, context(req));
  const item = await readService.getById(req.validated.params.id, context(req), memberId);
  sendSuccess(res, { data: await enrichClassView(item, memberId) });
};
/** Bộ lọc quản lý theo phạm vi quyền. */
export const filters = async (req, res) =>
  sendSuccess(res, { data: await readService.getFilters(context(req)) });
/** Danh sách HLV cho cấu hình lớp. */
export const listCoaches = async (_req, res) =>
  sendSuccess(res, { data: await readService.listCoaches() });
/** Tạo lớp. */
export const create = async (req, res) =>
  sendCreated(res, await classService.create(req.validated.body, req.user));
/** Sửa lớp. */
export const update = async (req, res) =>
  sendSuccess(res, {
    data: await classService.update(req.validated.params.id, req.validated.body, req.user),
    message: 'Đã cập nhật lớp và thông báo hội viên đã đăng ký',
  });
/** Huỷ lớp. */
export const cancel = async (req, res) =>
  sendSuccess(res, {
    data: await classService.cancel(req.validated.params.id, req.user),
    message: 'Đã hủy lớp và thông báo hội viên đã đăng ký',
  });

/** POST /classes/:id/update-preview: số buổi đổi và học viên bị ảnh hưởng trước khi lưu. */
export const previewUpdate = async (req, res) =>
  sendSuccess(res, {
    data: await previewClassUpdate(req.validated.params.id, req.validated.body),
  });
