import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './cancellation.controller.js';
import { cancelPurchaseSchema, purchaseIdSchema } from './cancellation.validation.js';

const router = Router();
const plan = authorize(P.MEMBERSHIP_PURCHASE, P.MEMBERSHIP_MANAGE);
const course = authorize(P.CLASS_CANCEL_SELF, P.CLASS_ENROLL_FOR_MEMBER);

// Quyền theo chủ sở hữu được kiểm tra lại trong service (tự làm hay làm hộ).
router.get(
  '/memberships/:id/cancel-preview',
  authenticate,
  plan,
  validate(purchaseIdSchema),
  controller.previewMembership,
);
router.post(
  '/memberships/:id/cancel',
  authenticate,
  plan,
  validate(cancelPurchaseSchema),
  controller.cancelMembership,
);
router.get(
  '/enrollments/:id/cancel-preview',
  authenticate,
  course,
  validate(purchaseIdSchema),
  controller.previewEnrollment,
);
router.post(
  '/enrollments/:id/cancel',
  authenticate,
  course,
  validate(cancelPurchaseSchema),
  controller.cancelEnrollment,
);

export default router;
