import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { createCounterOrder } from '../payment/payment.controller.js';
import { createCounterOrderSchema } from '../payment/payment.validation.js';

const router = Router();
router.use(authenticate);
router.post(
  '/orders',
  authorize(PERMISSIONS.MEMBERSHIP_MANAGE),
  validate(createCounterOrderSchema),
  createCounterOrder,
);
export default router;
