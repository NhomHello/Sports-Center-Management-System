import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

const idParam = z.object({ id: z.coerce.number().int().positive() });

const roleFields = {
  name: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
  description: z.string().trim().max(VALIDATION.NAME_MAX_LENGTH).optional(),
  permissionCodes: z.array(z.string()).default([]),
};

export const roleIdSchema = { params: idParam };

export const createRoleSchema = {
  body: z.object({
    code: z
      .string()
      .trim()
      .regex(VALIDATION.ROLE_CODE_REGEX, 'Mã vai trò: IN_HOA, số, gạch dưới (VD: SALES_STAFF)'),
    ...roleFields,
  }),
};

export const updateRoleSchema = {
  params: idParam,
  body: z.object({
    name: roleFields.name.optional(),
    description: roleFields.description,
    permissionCodes: z.array(z.string()).optional(),
  }),
};
