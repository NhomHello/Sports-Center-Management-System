import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';
const query = paginationQuerySchema
  .extend({ search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional() })
  .strict();
export const ownHistorySchema = { query };
export const historySchema = {
  query: query.extend({ memberId: z.coerce.number().int().positive().optional() }),
};
export const historyIdSchema = {
  params: z.object({ id: z.coerce.number().int().positive() }).strict(),
};
