import { PERMISSIONS } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './schedule.controller.js';
import { mySchedulesSchema, teachingScheduleSchema } from './schedule.validation.js';

const router = Router();

router.use(authenticate);

router.get(
  '/me',
  authorize(PERMISSIONS.SCHEDULE_VIEW_OWN),
  validate(mySchedulesSchema),
  controller.myWeek,
);
router.get(
  '/teaching',
  authorize(PERMISSIONS.SCHEDULE_VIEW_TEACHING),
  validate(teachingScheduleSchema),
  controller.teaching,
);

export default router;
