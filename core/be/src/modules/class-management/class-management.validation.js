import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';
import { Enums } from '../../config/db.js';

const id = z.coerce.number().int().positive();

export const listClassesSchema = {
  query: paginationQuerySchema.extend({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD')
      .optional(),
    status: z.enum(Object.values(Enums.ClassStatus)).optional(),
    subjectId: id.optional(),
    coachId: id.optional(),
    search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional(),
  }),
};

export const classIdSchema = { params: z.object({ id }) };

export const sessionRosterSchema = { params: z.object({ sessionId: id }) };
