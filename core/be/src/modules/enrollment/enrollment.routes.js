import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './enrollment.controller.js';
import {
  cancelForMemberSchema,
  enrollForMemberSchema,
  sessionIdSchema,
} from './enrollment.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/:sessionId/enrollments/me',
  authorize(PERMISSIONS.CLASS_ENROLL_SELF),
  validate(sessionIdSchema),
  controller.enrollSelf,
);
router.delete(
  '/:sessionId/enrollments/me',
  authorize(PERMISSIONS.CLASS_CANCEL_SELF),
  validate(sessionIdSchema),
  controller.cancelSelf,
);
router.post(
  '/:sessionId/enrollments',
  authorize(PERMISSIONS.CLASS_ENROLL_FOR_MEMBER),
  validate(enrollForMemberSchema),
  controller.enrollForMember,
);
router.delete(
  '/:sessionId/enrollments/:memberId',
  authorize(PERMISSIONS.CLASS_ENROLL_FOR_MEMBER),
  validate(cancelForMemberSchema),
  controller.cancelForMember,
);

export default router;
