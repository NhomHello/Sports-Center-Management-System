import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './purchase-change-request.service.js';

const context = (req) => ({ user: req.user, permissions: req.permissions });
const changedMessage = (data) =>
  data.status === 'PENDING_PAYMENT'
    ? 'Cần thanh toán chênh lệch để hoàn tất đổi'
    : 'Đã đổi thành công';

/** GET /memberships/:id/change-preview */
export const previewPlan = async (req, res) =>
  sendSuccess(res, {
    data: await service.previewPlanChange(
      req.validated.params.id,
      req.validated.query.planId,
      context(req),
    ),
  });

/** GET /enrollments/:id/change-preview */
export const previewClass = async (req, res) =>
  sendSuccess(res, {
    data: await service.previewClassChange(
      req.validated.params.id,
      req.validated.query.classId,
      context(req),
    ),
  });

/** POST /memberships/:id/change */
export const changePlan = async (req, res) => {
  const data = await service.changePlan(req.validated.params.id, req.validated.body, context(req));
  sendSuccess(res, { data, message: changedMessage(data) });
};

/** POST /enrollments/:id/change */
export const changeClass = async (req, res) => {
  const data = await service.changeClass(req.validated.params.id, req.validated.body, context(req));
  sendSuccess(res, { data, message: changedMessage(data) });
};
