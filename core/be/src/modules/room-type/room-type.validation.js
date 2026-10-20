import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();
const body = z
  .object({
    name: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
    description: z.string().trim().max(VALIDATION.DESCRIPTION_MAX_LENGTH).nullable().optional(),
    isSelfTrainingArea: z.boolean().optional(),
    isActive: z.boolean().optional(),
    subjectIds: z.array(id).max(VALIDATION.NAME_MAX_LENGTH).optional(),
  })
  .strict();

export const roomTypeIdSchema = { params: z.object({ id }) };
export const createRoomTypeSchema = { body };
export const updateRoomTypeSchema = {
  params: z.object({ id }),
  body: body.partial().refine((v) => Object.keys(v).length > 0, 'Chưa nhập thay đổi'),
};
