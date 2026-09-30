import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './membership-plan.controller.js';
import {
  createMembershipPlanSchema,
  listMembershipPlanSchema,
  membershipPlanIdSchema,
  updateMembershipPlanSchema,
} from './membership-plan.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(PERMISSIONS.MEMBERSHIP_PLAN_READ),
  validate(listMembershipPlanSchema),
  controller.list,
);

router.post(
  '/',
  authorize(PERMISSIONS.MEMBERSHIP_PLAN_CREATE),
  validate(createMembershipPlanSchema),
  controller.create,
);

router.get(
  '/:id',
  authorize(PERMISSIONS.MEMBERSHIP_PLAN_READ),
  validate(membershipPlanIdSchema),
  controller.getById,
);

router.put(
  '/:id',
  authorize(PERMISSIONS.MEMBERSHIP_PLAN_UPDATE),
  validate(updateMembershipPlanSchema),
  controller.update,
);

export default router;
