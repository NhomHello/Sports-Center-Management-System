import { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './cancellation-history.controller.js';
import * as schema from './cancellation-history.validation.js';
const router = Router();
router.use(authenticate);
router.get(
  '/me',
  authorize(P.INVOICE_READ_OWN, P.SCHEDULE_VIEW_OWN, P.CLASS_CANCEL_SELF),
  validate(schema.ownHistorySchema),
  controller.own,
);
router.get(
  '/',
  authorize(P.INVOICE_READ_ALL, P.CLASS_ENROLL_FOR_MEMBER),
  validate(schema.historySchema),
  controller.list,
);
router.get(
  '/:id',
  authorize(
    P.INVOICE_READ_OWN,
    P.SCHEDULE_VIEW_OWN,
    P.CLASS_CANCEL_SELF,
    P.INVOICE_READ_ALL,
    P.CLASS_ENROLL_FOR_MEMBER,
  ),
  validate(schema.historyIdSchema),
  controller.detail,
);
export default router;
