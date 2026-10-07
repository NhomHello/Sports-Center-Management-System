import { sendCreated, sendSuccess } from '../../common/utils/api-response.js';
import * as enrollmentService from './enrollment.service.js';

/** POST /sessions/:sessionId/enrollments/me */
export const enrollSelf = async (req, res) => {
  const data = await enrollmentService.enroll({
    sessionId: req.validated.params.sessionId,
    memberId: req.user.id,
    actorId: req.user.id,
  });
  sendCreated(res, data, 'Đăng ký lớp thành công');
};

/** DELETE /sessions/:sessionId/enrollments/me */
export const cancelSelf = async (req, res) => {
  const data = await enrollmentService.cancel({
    sessionId: req.validated.params.sessionId,
    memberId: req.user.id,
    actorId: req.user.id,
  });
  sendSuccess(res, { data, message: 'Đã huỷ đăng ký' });
};

/** POST /sessions/:sessionId/enrollments (nhân viên đăng ký hộ) */
export const enrollForMember = async (req, res) => {
  const data = await enrollmentService.enroll({
    sessionId: req.validated.params.sessionId,
    memberId: req.validated.body.memberId,
    actorId: req.user.id,
  });
  sendCreated(res, data, 'Đã đăng ký lớp hộ hội viên');
};

/** DELETE /sessions/:sessionId/enrollments/:memberId (nhân viên huỷ hộ) */
export const cancelForMember = async (req, res) => {
  const { sessionId, memberId } = req.validated.params;
  const data = await enrollmentService.cancel({ sessionId, memberId, actorId: req.user.id });
  sendSuccess(res, { data, message: 'Đã huỷ đăng ký hộ hội viên' });
};
