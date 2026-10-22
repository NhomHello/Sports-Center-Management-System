import { z } from 'zod';

const id = z.coerce.number().int().positive();
const params = z.object({ id });
const settlement = z.enum(['REFUND', 'CREDIT']).optional();

export const planPreviewSchema = { params, query: z.object({ planId: id }) };
export const classPreviewSchema = { params, query: z.object({ classId: id }) };
export const changePlanSchema = { params, body: z.object({ planId: id, settlement }).strict() };
export const changeClassSchema = { params, body: z.object({ classId: id, settlement }).strict() };
