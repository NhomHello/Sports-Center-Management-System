import { sendSuccess } from '../../common/utils/api-response.js';
import { excuseSession } from './attendance-excuse.service.js';

/** POST /classes/sessions/:id/excuse — báo nghỉ một buổi. */
export const excuse = async (req, res) =>
  sendSuccess(res, {
    data: await excuseSession(req.validated.params.id, req.validated.body, {
      user: req.user,
      permissions: req.permissions,
    }),
    message: 'Đã báo nghỉ buổi học',
  });
