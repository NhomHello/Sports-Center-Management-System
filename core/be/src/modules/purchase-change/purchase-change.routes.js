import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './purchase-change.controller.js';
import * as v from './purchase-change.validation.js';

const router = Router();
const plan = authorize(P.MEMBERSHIP_PURCHASE, P.MEMBERSHIP_MANAGE);
const course = authorize(P.CLASS_CANCEL_SELF, P.CLASS_ENROLL_FOR_MEMBER);

// Quyền theo chủ sở hữu được kiểm tra lại trong service (tự làm hay làm hộ).
router.get(
  '/memberships/:id/change-preview',
  authenticate,
  plan,
  validate(v.planPreviewSchema),
  controller.previewPlan,
);
router.post(
  '/memberships/:id/change',
  authenticate,
  plan,
  validate(v.changePlanSchema),
  controller.changePlan,
);
router.get(
  '/enrollments/:id/change-preview',
  authenticate,
  course,
  validate(v.classPreviewSchema),
  controller.previewClass,
);
router.post(
  '/enrollments/:id/change',
  authenticate,
  course,
  validate(v.changeClassSchema),
  controller.changeClass,
);

export default router;
