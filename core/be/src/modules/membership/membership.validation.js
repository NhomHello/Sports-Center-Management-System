import { z } from 'zod';

export const memberMembershipSchema = {
  params: z.object({
    memberId: z.coerce.number().int().positive(),
  }),
};
