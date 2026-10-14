import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

const text = z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH);
export const auditListSchema = {
  query: paginationQuerySchema
    .extend({
      userId: z.coerce.number().int().positive().optional(),
      search: text.optional(),
      action: text.optional(),
      entity: text.optional(),
      entityId: text.optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, 'Khoảng thời gian không hợp lệ'),
};
