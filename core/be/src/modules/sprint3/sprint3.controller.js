import { sendSuccess, sendCreated } from '../../common/utils/api-response.js';
import * as sessions from '../class/class-session.service.js';
import * as waitlist from '../class/class-waitlist.service.js';
import * as freeze from '../membership/membership-freeze.service.js';
import * as maintenance from '../room/room-maintenance.service.js';
import * as attendance from '../attendance/attendance.service.js';
import { unblock } from '../attendance/no-show.service.js';
import { preview } from '../user/user-booking-lock.service.js';
const context = (req) => ({ user: req.user, permissions: req.permissions });
/** Đổi giờ một buổi. */
export const reschedule = async (req, res) =>
  sendSuccess(res, {
    data: await sessions.update(req.validated.params.id, req.validated.body, req.user),
  });
/** Huỷ một buổi. */
export const cancelSession = async (req, res) =>
  sendSuccess(res, {
    data: await sessions.cancel(req.validated.params.id, req.validated.body.reason, req.user),
  });
/** Đổi HLV. */
export const changeCoach = async (req, res) =>
  sendSuccess(res, {
    data: await sessions.changeCoach(req.validated.params.id, req.validated.body, req.user),
  });
/** Vào danh sách chờ. */
export const joinWaitlist = async (req, res) =>
  sendCreated(res, await waitlist.join(req.validated.params.id, req.user));
/** Rời danh sách chờ. */
export const leaveWaitlist = async (req, res) =>
  sendSuccess(res, { data: await waitlist.leave(req.validated.params.id, req.user) });
/** Trạng thái chờ của chính mình. */
export const ownWaitlist = async (req, res) =>
  sendSuccess(res, { data: await waitlist.own(req.validated.params.id, req.user) });
/** Tạo bảo lưu. */
export const createFreeze = async (req, res) =>
  sendCreated(res, await freeze.freeze(req.validated.params.id, req.validated.body, context(req)));
/** Kết thúc bảo lưu. */
export const resumeFreeze = async (req, res) =>
  sendSuccess(res, { data: await freeze.resume(req.validated.params.id, context(req)) });
/** Xem tác động bảo trì. */
export const previewMaintenance = async (req, res) =>
  sendSuccess(res, {
    data: await maintenance.preview(req.validated.params.id, req.validated.query),
  });
/** Áp dụng kế hoạch bảo trì. */
export const createMaintenance = async (req, res) =>
  sendCreated(res, await maintenance.create(req.validated.params.id, req.validated.body, req.user));
/** Check-in tại quầy. */
export const checkIn = async (req, res) =>
  sendCreated(res, await attendance.checkIn(req.validated.body.memberId, req.user));
/** Roster từng buổi. */
export const roster = async (req, res) =>
  sendSuccess(res, { data: await attendance.roster(req.validated.params.id, context(req)) });
/** Điểm danh theo buổi. */
export const recordAttendance = async (req, res) =>
  sendSuccess(res, {
    data: await attendance.record(
      req.validated.params.id,
      req.validated.body.entries,
      context(req),
    ),
  });
/** Mở hạn sửa điểm danh. */
export const unlockAttendance = async (req, res) =>
  sendSuccess(res, {
    data: await attendance.unlock(req.validated.params.id, req.validated.body.reason, context(req)),
  });
/** Xem trước tác động khoá tài khoản. */
export const lockPreview = async (req, res) =>
  sendSuccess(res, { data: await preview(req.validated.params.id) });
/** Gỡ chặn do vắng mặt. */
export const unblockMember = async (req, res) =>
  sendSuccess(res, {
    data: await unblock(req.validated.params.id, req.validated.body.reason, req.user),
  });
