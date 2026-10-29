import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './credit.controller.js';
import { applyCreditSchema, memberCreditSchema, ownCreditSchema } from './credit.validation.js';

const router = Router();

router.get(
  '/me/credit',
  authenticate,
  authorize(P.PAYMENT_READ_OWN, P.PAYMENT_READ_ALL),
  validate(ownCreditSchema),
  controller.ownCredit,
);
router.get(
  '/members/:id/credit',
  authenticate,
  authorize(P.PAYMENT_READ_ALL),
  validate(memberCreditSchema),
  controller.memberCredit,
);
router.post(
  '/invoices/:id/apply-credit',
  authenticate,
  authorize(P.PAYMENT_CHECKOUT, P.PAYMENT_RECORD_CASH),
  validate(applyCreditSchema),
  controller.applyCredit,
);

export default router;
