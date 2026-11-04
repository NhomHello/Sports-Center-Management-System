import { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as c from './course-history.controller.js';
import * as v from './course-history.validation.js';
const router = Router();
router.get(
  '/attendance/courses',
  authenticate,
  authorize(P.SCHEDULE_VIEW_OWN),
  validate(v.ownListSchema),
  c.ownCourses,
);
router.get(
  '/attendance/courses/:classId',
  authenticate,
  authorize(P.SCHEDULE_VIEW_OWN),
  validate(v.ownDetailSchema),
  c.ownCourse,
);
router.get(
  '/members/:memberId/course-history',
  authenticate,
  authorize(P.ATTENDANCE_MANAGE),
  validate(v.memberListSchema),
  c.memberCourses,
);
router.get(
  '/members/:memberId/course-history/:classId',
  authenticate,
  authorize(P.ATTENDANCE_MANAGE),
  validate(v.memberDetailSchema),
  c.memberCourse,
);
export default router;
