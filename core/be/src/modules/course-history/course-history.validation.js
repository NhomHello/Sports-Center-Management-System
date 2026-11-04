import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';
const id = z.coerce.number().int().positive();
const query = paginationQuerySchema
  .extend({ search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional() })
  .strict();
export const ownListSchema = { query };
export const ownDetailSchema = { params: z.object({ classId: id }), query: z.object({}).strict() };
export const memberListSchema = { params: z.object({ memberId: id }), query };
export const memberDetailSchema = {
  params: z.object({ memberId: id, classId: id }),
  query: z.object({}).strict(),
};
