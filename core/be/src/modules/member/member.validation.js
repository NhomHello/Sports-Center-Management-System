import { z } from 'zod';
import { emailSchema, phoneSchema } from '../../common/validators/identity.schema.js';
import { VALIDATION } from '../../constants/index.js';

export const updateOwnProfileSchema = {
  body: z
    .object({
      email: emailSchema.optional(),
      fullName: z
        .string()
        .trim()
        .min(VALIDATION.NAME_MIN_LENGTH)
        .max(VALIDATION.NAME_MAX_LENGTH)
        .optional(),
      phone: phoneSchema.nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất một trường để cập nhật'),
};
