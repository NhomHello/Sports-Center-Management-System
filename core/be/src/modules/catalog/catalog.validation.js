import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();
const name = z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH);
const description = z.string().trim().max(VALIDATION.DESCRIPTION_MAX_LENGTH).nullable().optional();
export const catalogIdSchema = { params: z.object({ id }) };
export const listCatalogSchema = {
  query: paginationQuerySchema.extend({
    search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  }),
};
export const subjectBody = z
  .object({ name, description, isActive: z.boolean().optional() })
  .strict();
export const roomBody = subjectBody.extend({ capacity: id });
/** Ghép schema theo tài nguyên; PUT cập nhật từng phần nhưng không nhận body rỗng. */
export const catalogBodySchema = (body, isUpdate = false) => ({
  ...(isUpdate && catalogIdSchema),
  body: isUpdate
    ? body.partial().refine((v) => Object.keys(v).length > 0, 'Chưa nhập thay đổi')
    : body,
});
