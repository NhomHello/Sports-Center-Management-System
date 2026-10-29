import { sendSuccess } from '../../common/utils/api-response.js';
import * as service from './cancellation.service.js';

const context = (req) => ({ user: req.user, permissions: req.permissions });

/** GET /memberships/:id/cancel-preview */
export const previewMembership = async (req, res) =>
  sendSuccess(res, {
    data: await service.previewMembership(req.validated.params.id, context(req)),
  });

/** POST /memberships/:id/cancel */
export const cancelMembership = async (req, res) =>
  sendSuccess(res, {
    data: await service.cancelMembership(req.validated.params.id, req.validated.body, context(req)),
    message: 'Đã hủy kỳ gói',
  });

/** GET /enrollments/:id/cancel-preview */
export const previewEnrollment = async (req, res) =>
  sendSuccess(res, {
    data: await service.previewEnrollment(req.validated.params.id, context(req)),
  });

/** POST /enrollments/:id/cancel */
export const cancelEnrollment = async (req, res) =>
  sendSuccess(res, {
    data: await service.cancelEnrollment(req.validated.params.id, req.validated.body, context(req)),
    message: 'Đã hủy khóa học',
  });
