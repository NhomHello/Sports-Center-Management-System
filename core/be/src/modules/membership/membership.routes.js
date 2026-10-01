import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { createCounterOrder } from '../payment/payment.controller.js';
import { createCounterOrderSchema } from '../payment/payment.validation.js';
import * as controller from './membership.controller.js';
import { memberMembershipSchema, purchaseMembershipSchema } from './membership.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/orders',
  authorize(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(createCounterOrderSchema),
  createCounterOrder,
);

router.get(
  '/me',
  authorize(PERMISSIONS.MEMBERSHIP_READ_OWN, PERMISSIONS.MEMBERSHIP_READ_ALL),
  controller.getMyCurrent,
);

router.get(
  '/me/current',
  authorize(PERMISSIONS.MEMBERSHIP_READ_OWN, PERMISSIONS.MEMBERSHIP_READ_ALL),
  controller.getMyCurrent,
);

router.get(
  '/member/:memberId/current',
  authorize(PERMISSIONS.MEMBERSHIP_READ_ALL),
  validate(memberMembershipSchema),
  controller.getCurrentByMemberId,
);

router.post(
  '/purchase',
  authorize(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(purchaseMembershipSchema),
  controller.purchaseOrRenew,
);
export default router;
