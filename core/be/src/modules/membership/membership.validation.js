import { z } from 'zod';

export const memberMembershipSchema = {
  params: z.object({
    memberId: z.coerce.number().int().positive(),
  }),
};

export const purchaseMembershipSchema = {
  body: z.object({
    memberId: z.coerce.number().int().positive(),
    planId: z.coerce.number().int().positive(),
    paidAt: z.coerce.date(),
  }),
};
