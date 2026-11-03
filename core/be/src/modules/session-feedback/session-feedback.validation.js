import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { COURSE_CONTENT as L } from '../../constants/index.js';
const id = z.coerce.number().int().positive();
export const sessionSchema = { params: z.object({ id }) };
export const saveSchema = {
  params: z.object({ id, memberId: id }),
  body: z
    .object({
      rating: z.number().int().min(L.RATING_MIN).max(L.RATING_MAX).nullable().default(null),
      note: z.string().trim().max(L.NOTE_MAX).default(''),
      expectedVersion: z.number().int().nonnegative(),
    })
    .strict()
    .refine((v) => v.rating !== null || v.note.length > 0, 'Nhập đánh giá hoặc ghi chú'),
};
export const ownSchema = {
  query: paginationQuerySchema.extend({ classId: id.optional() }).strict(),
};
export const descriptionSchema = {
  ...sessionSchema,
  body: z.object({ description: z.string().trim().max(L.DESCRIPTION_MAX).nullable() }).strict(),
};
