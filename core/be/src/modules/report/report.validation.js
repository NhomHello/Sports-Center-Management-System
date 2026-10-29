import { z } from 'zod';
import { SPRINT3, TIME } from '../../constants/index.js';
const id = z.coerce.number().int().positive();
const filters = {
  from: z.iso.date(),
  to: z.iso.date(),
  planId: id.optional(),
  memberId: id.optional(),
};
const validRange = (q) =>
  q.to >= q.from &&
  (new Date(q.to) - new Date(q.from)) / TIME.MS_PER_DAY <= SPRINT3.REPORT_MAX_DAYS;
export const reportSchema = {
  query: z.object(filters).strict().refine(validRange, 'Khoảng báo cáo không hợp lệ hoặc quá dài'),
};
export const exportSchema = {
  query: z
    .object({ ...filters, format: z.enum(['csv', 'xlsx', 'pdf']) })
    .strict()
    .refine(validRange, 'Khoảng báo cáo không hợp lệ hoặc quá dài'),
};
