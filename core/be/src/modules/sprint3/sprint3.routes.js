import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as c from './sprint3.controller.js';
import * as v from './sprint3.validation.js';
const router = Router();
router.patch(
  '/classes/sessions/:id',
  authenticate,
  authorize(P.CLASS_UPDATE),
  validate(v.sessionSchema),
  c.reschedule,
);
router.post(
  '/classes/sessions/:id/cancellation',
  authenticate,
  authorize(P.CLASS_DELETE),
  validate(v.reasonSchema),
  c.cancelSession,
);
router.patch(
  '/classes/:id/coach',
  authenticate,
  authorize(P.CLASS_UPDATE),
  validate(v.coachSchema),
  c.changeCoach,
);
router.post(
  '/classes/:id/waitlist/me',
  authenticate,
  authorize(P.CLASS_ENROLL_SELF),
  validate(v.idSchema),
  c.joinWaitlist,
);
router.get(
  '/classes/:id/waitlist/me',
  authenticate,
  authorize(P.CLASS_ENROLL_SELF),
  validate(v.idSchema),
  c.ownWaitlist,
);
router.delete(
  '/classes/:id/waitlist/me',
  authenticate,
  authorize(P.CLASS_ENROLL_SELF),
  validate(v.idSchema),
  c.leaveWaitlist,
);
router.post(
  '/memberships/:id/freezes',
  authenticate,
  authorize(P.MEMBERSHIP_FREEZE_SELF, P.MEMBERSHIP_FREEZE_ALL),
  validate(v.freezeSchema),
  c.createFreeze,
);
router.post(
  '/memberships/:id/freezes/resume',
  authenticate,
  authorize(P.MEMBERSHIP_FREEZE_SELF, P.MEMBERSHIP_FREEZE_ALL),
  validate(v.idSchema),
  c.resumeFreeze,
);
router.get(
  '/rooms/:id/maintenance-preview',
  authenticate,
  authorize(P.ROOM_UPDATE),
  validate(v.maintenancePreviewSchema),
  c.previewMaintenance,
);
router.post(
  '/rooms/:id/maintenance',
  authenticate,
  authorize(P.ROOM_UPDATE),
  validate(v.maintenanceSchema),
  c.createMaintenance,
);
router.post(
  '/check-ins',
  authenticate,
  authorize(P.ATTENDANCE_CHECK_IN),
  validate(v.checkInSchema),
  c.checkIn,
);
router.get(
  '/classes/sessions/:id/attendance',
  authenticate,
  authorize(P.ATTENDANCE_RECORD, P.ATTENDANCE_MANAGE),
  validate(v.idSchema),
  c.roster,
);
router.put(
  '/classes/sessions/:id/attendance',
  authenticate,
  authorize(P.ATTENDANCE_RECORD, P.ATTENDANCE_MANAGE),
  validate(v.attendanceSchema),
  c.recordAttendance,
);
router.post(
  '/classes/sessions/:id/attendance-unlock',
  authenticate,
  authorize(P.ATTENDANCE_MANAGE),
  validate(v.reasonSchema),
  c.unlockAttendance,
);
router.get(
  '/users/:id/lock-preview',
  authenticate,
  authorize(P.USER_DELETE),
  validate(v.idSchema),
  c.lockPreview,
);
router.post(
  '/members/:id/booking-unblock',
  authenticate,
  authorize(P.CLASS_UNBLOCK),
  validate(v.reasonSchema),
  c.unblockMember,
);
export default router;
