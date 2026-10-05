import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as enrollmentService from './class-enrollment.service.js';
import { getRoster } from './class-roster.service.js';
/** Tự đăng ký: không lấy memberId từ client. */
export const enrollSelf = async (req, res) =>
  sendCreated(res, await enrollmentService.enroll(req.validated.params.id, req.user.id, req.user));
/** Tự huỷ: chỉ booking của chủ token. */
export const cancelSelf = async (req, res) =>
  sendSuccess(res, {
    data: await enrollmentService.cancel(req.validated.params.id, req.user.id, req.user),
  });
/** Đăng ký hộ có quyền riêng và lưu actor. */
export const enrollForMember = async (req, res) =>
  sendCreated(
    res,
    await enrollmentService.enroll(req.validated.params.id, req.validated.body.memberId, req.user),
  );
/** Huỷ hộ cùng luật như tự huỷ. */
export const cancelForMember = async (req, res) =>
  sendSuccess(res, {
    data: await enrollmentService.cancel(
      req.validated.params.id,
      req.validated.params.memberId,
      req.user,
    ),
  });
/** Danh sách học viên và lịch sử booking. */
export const roster = async (req, res) =>
  sendSuccess(res, {
    data: await getRoster(req.validated.params.id, {
      user: req.user,
      permissions: req.permissions,
    }),
  });
/** Các lớp của hội viên đã chọn. */
export const memberEnrollments = async (req, res) =>
  sendSuccess(res, { data: await enrollmentService.listForMember(req.validated.params.id) });
