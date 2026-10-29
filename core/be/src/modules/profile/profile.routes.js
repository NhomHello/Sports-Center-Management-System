import express, { Router } from 'express';
import { PERMISSIONS as P } from '@scms/shared';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ApiError } from '../../common/errors/api-error.js';
import { PROFILE_LIMITS } from '../../constants/sprint4.js';
import * as v from './profile.validation.js';
import * as c from './profile.controller.js';
const router = Router();
router.use(authenticate);
const rawImage = express.raw({
  type: ['image/jpeg', 'image/png'],
  limit: PROFILE_LIMITS.AVATAR_BYTES,
});
const parseImage = (req, res, next) =>
  rawImage(req, res, (error) =>
    error ? next(ApiError.badRequest('Ảnh phải là JPG/PNG, tối đa 2 MB')) : next(),
  );
router.get('/me/coach-profile', authorize(P.COACH_PROFILE_UPDATE_OWN), c.ownCoach);
router.put(
  '/me/coach-profile',
  authorize(P.COACH_PROFILE_UPDATE_OWN),
  validate(v.coachSchema),
  c.saveCoach,
);
router.get('/me/coach-profile/avatar', authorize(P.COACH_PROFILE_UPDATE_OWN), c.ownAvatar);
router.put(
  '/me/coach-profile/avatar',
  authorize(P.COACH_PROFILE_UPDATE_OWN),
  parseImage,
  c.uploadAvatar,
);
router.get('/me/member-profile', authorize(P.MEMBER_PROFILE_READ_OWN), c.ownMember);
router.put(
  '/me/member-profile',
  authorize(P.MEMBER_PROFILE_UPDATE_OWN),
  validate(v.memberSchema),
  c.saveOwnMember,
);
router.get('/members/:id/profile', authorize(P.MEMBER_READ), validate(v.idSchema), c.staffMember);
router.put(
  '/members/:id/profile',
  authorize(P.MEMBER_UPDATE),
  validate(v.staffMemberSchema),
  c.saveStaffMember,
);
router.get('/coaches', authorize(P.COACH_PROFILE_READ), validate(v.coachListSchema), c.coaches);
router.get('/coaches/subjects', authorize(P.COACH_PROFILE_READ), c.coachSubjects);
router.get('/coaches/:id', authorize(P.COACH_PROFILE_READ), validate(v.idSchema), c.coach);
router.get(
  '/coaches/:id/avatar',
  authorize(P.COACH_PROFILE_READ),
  validate(v.idSchema),
  c.coachAvatar,
);
router.get(
  '/coach/members',
  authorize(P.MEMBER_PROFILE_VIEW_ASSIGNED),
  validate(v.studentListSchema),
  c.members,
);
router.get(
  '/coach/members/:id',
  authorize(P.MEMBER_PROFILE_VIEW_ASSIGNED),
  validate(v.idSchema),
  c.member,
);
export default router;
