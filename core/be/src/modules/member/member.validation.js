import { z } from 'zod';
import { fullNameField, emailField, phoneField } from '../../common/validators/account-fields.js';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

export const updateOwnProfileSchema = {
  body: z
    .object({
      fullName: fullNameField.optional(),
      email: emailField.optional(),
      phone: phoneField.nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, 'Cần ít nhất một trường cập nhật'),
};

export const listMembersSchema = {
  query: paginationQuerySchema.extend({
    search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional(),
  }),
};
