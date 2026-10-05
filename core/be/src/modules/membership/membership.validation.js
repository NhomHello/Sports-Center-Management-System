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
