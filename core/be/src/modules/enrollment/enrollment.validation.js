import { z } from 'zod';

const sessionParams = z.object({ sessionId: z.coerce.number().int().positive() });

export const sessionIdSchema = { params: sessionParams };

export const enrollForMemberSchema = {
  params: sessionParams,
  body: z.object({ memberId: z.coerce.number().int().positive() }).strict(),
};

export const cancelForMemberSchema = {
  params: sessionParams.extend({ memberId: z.coerce.number().int().positive() }),
};
