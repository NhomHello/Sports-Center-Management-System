import { z } from 'zod';

export const memberMembershipSchema = {
  params: z.object({
    memberId: z.coerce.number().int().positive(),
  }),
};

export const createOwnOrderSchema = {
  body: z
    .object({
      planId: z.coerce.number().int().positive(),
    })
    .strict(),
};

export const membershipIdSchema = {
  params: z.object({ id: z.coerce.number().int().positive() }),
};
