import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { Enums } from '../../config/db.js';
export const historySchema = {
  query: paginationQuerySchema
    .extend({
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      classId: z.coerce.number().int().positive().optional(),
      status: z.nativeEnum(Enums.AttendanceStatus).optional(),
    })
    .strict()
    .refine((q) => !q.from || !q.to || q.to >= q.from, 'Khoảng ngày không hợp lệ'),
};
