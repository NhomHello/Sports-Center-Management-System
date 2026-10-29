import { PERMISSIONS as P } from '@scms/shared';
import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import * as c from './course-summary.controller.js';
import * as v from './course-summary.validation.js';
const r = Router();
r.get(
  '/reports/course-summaries/filters',
  authenticate,
  authorize(P.COURSE_SUMMARY_VIEW_ALL),
  c.getReportFilters,
);
r.get(
  '/classes/:id/ratings/me',
  authenticate,
  authorize(P.COURSE_RATING_WRITE_OWN),
  validate(v.idSchema),
  c.getOwnRating,
);
r.get(
  '/course-ratings/coaches',
  authenticate,
  authorize(P.COURSE_RATING_MODERATE),
  c.getRatedCoaches,
);
r.get(
  '/course-summaries',
  authenticate,
  authorize(P.COURSE_SUMMARY_MANAGE_ASSIGNED, P.COURSE_SUMMARY_VIEW_ALL),
  validate(v.summaryListSchema),
  c.list,
);
r.get(
  '/classes/:id/summary',
  authenticate,
  authorize(P.COURSE_SUMMARY_MANAGE_ASSIGNED, P.COURSE_SUMMARY_VIEW_ALL),
  validate(v.idSchema),
  c.get,
);
r.put(
  '/classes/:id/summary/items/:itemId',
  authenticate,
  authorize(P.COURSE_SUMMARY_MANAGE_ASSIGNED),
  validate(v.itemSchema),
  c.update,
);
r.post(
  '/classes/:id/summary/publish',
  authenticate,
  authorize(P.COURSE_SUMMARY_MANAGE_ASSIGNED),
  validate(v.publishSchema),
  c.publish,
);
r.post(
  '/classes/:id/summary/reopen',
  authenticate,
  authorize(P.COURSE_SUMMARY_REOPEN),
  validate(v.reopenSchema),
  c.reopen,
);
r.get(
  '/me/course-results',
  authenticate,
  authorize(P.COURSE_SUMMARY_READ_OWN),
  validate(v.listSchema),
  c.listResults,
);
r.get(
  '/me/course-results/:id/pdf',
  authenticate,
  authorize(P.COURSE_SUMMARY_READ_OWN),
  validate(v.idSchema),
  c.pdf,
);
r.post(
  '/classes/:id/ratings',
  authenticate,
  authorize(P.COURSE_RATING_WRITE_OWN),
  validate(v.ratingSchema),
  c.createRating,
);
r.put(
  '/classes/:id/ratings',
  authenticate,
  authorize(P.COURSE_RATING_WRITE_OWN),
  validate(v.ratingSchema),
  c.updateRating,
);
r.get(
  '/coaches/:id/ratings',
  authenticate,
  authorize(P.COACH_PROFILE_READ, P.COURSE_SUMMARY_MANAGE_ASSIGNED, P.COURSE_RATING_MODERATE),
  validate(v.ratingListSchema),
  c.listRatings,
);
r.patch(
  '/course-ratings/:id/moderation',
  authenticate,
  authorize(P.COURSE_RATING_MODERATE),
  validate(v.moderationSchema),
  c.moderate,
);
r.get(
  '/reports/course-summaries',
  authenticate,
  authorize(P.COURSE_SUMMARY_VIEW_ALL),
  validate(v.courseReportSchema),
  c.report,
);
r.get(
  '/reports/course-summaries/export',
  authenticate,
  authorize(P.COURSE_SUMMARY_VIEW_ALL),
  validate(v.courseReportSchema),
  c.exportExcel,
);
export default r;
