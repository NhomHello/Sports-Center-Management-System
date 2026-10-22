import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as controller from './course-order.controller.js';
import { createCourseOrderSchema } from './course-order.validation.js';

const router = Router();

router.post(
  '/classes/:id/orders',
  authenticate,
  authorize(P.CLASS_ENROLL_SELF, P.CLASS_ENROLL_FOR_MEMBER),
  validate(createCourseOrderSchema),
  controller.create,
);

export default router;
