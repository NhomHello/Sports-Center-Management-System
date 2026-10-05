import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './schedule.controller.js';
import { scheduleWeekSchema } from './schedule.validation.js';
const router = Router();
router.use(authenticate);
router.get('/me', authorize(P.SCHEDULE_VIEW_OWN), validate(scheduleWeekSchema), controller.own);
router.get(
  '/teaching',
  authorize(P.SCHEDULE_VIEW_TEACHING),
  validate(scheduleWeekSchema),
  controller.teaching,
);
router.get('/week', authorize(P.CLASS_READ_ALL), validate(scheduleWeekSchema), controller.week);
export default router;
