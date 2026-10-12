import { Router } from 'express';
import { PERMISSIONS } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './payment.controller.js';
import { cashPaymentSchema } from './payment.validation.js';

const router = Router();
router.use(authenticate);
router.post(
  '/invoices/:invoiceId/cash',
  authorize(PERMISSIONS.PAYMENT_RECORD_CASH),
  validate(cashPaymentSchema),
  controller.collectCash,
);
export default router;
