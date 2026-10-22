import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';

const idParams = z.object({ id: z.coerce.number().int().positive() });

export const ownCreditSchema = { query: paginationQuerySchema };

export const memberCreditSchema = { params: idParams, query: paginationQuerySchema };

export const applyCreditSchema = {
  params: idParams,
  body: z.object({ amount: z.coerce.number().int().positive().optional() }).strict(),
};
