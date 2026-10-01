import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();

export const invoiceIdSchema = { params: z.object({ invoiceId: id }) };
export const invoiceParamsSchema = { params: z.object({ id }) };

export const collectCashSchema = {
  params: z.object({ invoiceId: id }),
  body: z.object({
    receivedAmount: z.number().int().positive(),
    reference: z.string().trim().max(VALIDATION.PAYMENT_REFERENCE_MAX_LENGTH).optional(),
  }),
};
