import { z } from 'zod';

const REASON_MAX_LENGTH = 255;
const params = z.object({ id: z.coerce.number().int().positive() });

export const purchaseIdSchema = { params };

export const cancelPurchaseSchema = {
  params,
  body: z
    .object({
      settlement: z.literal('REFUND').default('REFUND'),
      reason: z.string().trim().max(REASON_MAX_LENGTH).optional(),
    })
    .strict(),
};
