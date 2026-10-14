import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { Enums } from '../../config/db.js';
import { VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();
export const invoiceParamsSchema = { params: z.object({ id }) };
export const cashPaymentSchema = {
  params: z.object({ invoiceId: id }),
  body: z.object({}).strict().optional(),
};
export const invoiceListSchema = {
  query: paginationQuerySchema.extend({
    memberId: id.optional(),
    status: z.enum(Object.values(Enums.InvoiceStatus)).optional(),
    channel: z.enum(Object.values(Enums.InvoiceChannel)).optional(),
    search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
};
export const createCounterOrderSchema = { body: z.object({ planId: id, memberId: id }).strict() };
