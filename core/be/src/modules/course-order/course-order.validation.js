import { z } from 'zod';

export const createCourseOrderSchema = {
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z
    .object({
      joinWaitlistWhenFull: z.boolean().default(false),
      memberId: z.coerce.number().int().positive().optional(),
      channel: z.enum(['ONLINE', 'COUNTER']).optional(),
    })
    .strict(),
};
