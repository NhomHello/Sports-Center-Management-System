import { z } from 'zod';
import { REPORT_GROUPS } from '../../constants/sprint4.js';
const id = z.coerce.number().int().positive();
const filters = {
  from: z.iso.date(),
  to: z.iso.date(),
  planId: id.optional(),
  memberId: id.optional(),
  groupBy: z.enum(REPORT_GROUPS).default('day'),
  compare: z.literal('previous').optional(),
};
const validRange = (q) => q.to >= q.from;
export const reportSchema = {
  query: z.object(filters).strict().refine(validRange, 'Khoảng báo cáo không hợp lệ hoặc quá dài'),
};
export const exportSchema = {
  query: z
    .object({ ...filters, format: z.enum(['csv', 'xlsx', 'pdf']) })
    .strict()
    .refine(validRange, 'Khoảng báo cáo không hợp lệ hoặc quá dài'),
};
