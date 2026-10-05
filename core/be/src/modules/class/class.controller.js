import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as readService from './class-read.service.js';
import * as classService from './class.service.js';
const context = (req) => ({ user: req.user, permissions: req.permissions });
/** Danh sách lớp có phạm vi xác thực. */
export const list = async (req, res) =>
  sendSuccess(res, await readService.list(req.validated.query, context(req)));
/** Chi tiết lớp. */
export const getById = async (req, res) =>
  sendSuccess(res, { data: await readService.getById(req.validated.params.id, context(req)) });
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
  });
/** Huỷ lớp. */
export const cancel = async (req, res) =>
  sendSuccess(res, { data: await classService.cancel(req.validated.params.id, req.user) });
