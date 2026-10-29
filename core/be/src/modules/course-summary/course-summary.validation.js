import { z } from 'zod';
import { Enums } from '../../config/db.js';
import { SPRINT3, TIME } from '../../constants/index.js';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { COURSE_LIMITS as L } from './course.constants.js';
const id = z.coerce.number().int().positive();
export const idSchema = { params: z.object({ id }) };
export const itemSchema = {
  params: z.object({ id, itemId: id }),
  body: z
    .object({
      result: z.nativeEnum(Enums.CourseResult),
      progress: z.number().int().min(L.MIN_STARS).max(L.MAX_STARS),
      comment: z.string().trim().max(L.TEXT_LENGTH).default(''),
      nextCourse: z.string().trim().max(L.TEXT_LENGTH).default(''),
    })
    .strict(),
};
export const publishSchema = {
  ...idSchema,
  body: z.object({ acknowledgeMissingAttendance: z.boolean().default(false) }).strict(),
};
export const reopenSchema = {
  ...idSchema,
  body: z.object({ reason: z.string().trim().min(1).max(L.REASON_LENGTH) }).strict(),
};
export const ratingSchema = {
  ...idSchema,
  body: z
    .object({
      courseStars: z.number().int().min(L.MIN_STARS).max(L.MAX_STARS),
      coachStars: z.number().int().min(L.MIN_STARS).max(L.MAX_STARS),
      comment: z.string().trim().max(L.TEXT_LENGTH).default(''),
    })
    .strict(),
};
export const listSchema = { query: paginationQuerySchema };
export const ratingListSchema = { ...idSchema, ...listSchema };
export const moderationSchema = {
  ...idSchema,
  body: z
    .object({ hidden: z.boolean(), reason: z.string().trim().min(1).max(L.REASON_LENGTH) })
    .strict(),
};
export const courseReportSchema = {
  query: z
    .object({
      from: z.iso.date(),
      to: z.iso.date(),
      coachId: id.optional(),
      subjectId: id.optional(),
    })
    .strict()
    .refine(
      (q) =>
        q.to >= q.from &&
        (new Date(q.to) - new Date(q.from)) / TIME.MS_PER_DAY <= SPRINT3.REPORT_MAX_DAYS,
      'Khoảng báo cáo không hợp lệ hoặc quá dài',
    ),
};

export const summaryListSchema = {
  query: paginationQuerySchema.extend({
    q: z.string().trim().max(L.TEXT_LENGTH).optional(),
    status: z.nativeEnum(Enums.CourseSummaryStatus).optional(),
  }),
};
