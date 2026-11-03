import { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as c from './session-feedback.controller.js';
import * as v from './session-feedback.validation.js';
const router = Router();
router.get(
  '/classes/sessions/:id/feedback',
  authenticate,
  authorize(P.ATTENDANCE_RECORD, P.ATTENDANCE_MANAGE),
  validate(v.sessionSchema),
  c.session,
);
router.put(
  '/classes/sessions/:id/feedback/:memberId',
  authenticate,
  authorize(P.ATTENDANCE_RECORD, P.ATTENDANCE_MANAGE),
  validate(v.saveSchema),
  c.save,
);
router.patch(
  '/classes/sessions/:id/description',
  authenticate,
  authorize(P.CLASS_UPDATE, P.SCHEDULE_VIEW_TEACHING),
  validate(v.descriptionSchema),
  c.description,
);
router.get(
  '/attendance/feedback/me',
  authenticate,
  authorize(P.SCHEDULE_VIEW_OWN),
  validate(v.ownSchema),
  c.own,
);
export default router;
