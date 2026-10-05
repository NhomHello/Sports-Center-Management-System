import { z } from 'zod';
const id = z.coerce.number().int().positive();
export const enrollForMemberSchema = {
  params: z.object({ id }),
  body: z.object({ memberId: id }).strict(),
};
export const cancelForMemberSchema = { params: z.object({ id, memberId: id }) };
export const memberEnrollmentsSchema = { params: z.object({ id }) };
