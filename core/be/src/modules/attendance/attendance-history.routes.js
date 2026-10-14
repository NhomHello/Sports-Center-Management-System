import { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { historySchema } from './attendance-history.validation.js';
import { ownHistory } from './attendance-history.controller.js';
const router = Router();
router.get(
  '/me',
  authenticate,
  authorize(P.SCHEDULE_VIEW_OWN),
  validate(historySchema),
  ownHistory,
);
export default router;
