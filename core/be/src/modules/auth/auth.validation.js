import { z } from 'zod';
import { emailSchema, phoneSchema } from '../../common/validators/identity.schema.js';
import { VALIDATION } from '../../constants/index.js';

export const loginSchema = {
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  }),
};

export const passwordChangeSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
      password: z.string().min(VALIDATION.PASSWORD_MIN_LENGTH).max(VALIDATION.PASSWORD_MAX_LENGTH),
    })
    .refine((data) => data.currentPassword !== data.password, {
      path: ['password'],
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    }),
};

export const registerSchema = {
  body: z.object({
    email: emailSchema,
    password: z
      .string()
      .min(
        VALIDATION.PASSWORD_MIN_LENGTH,
        `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`,
      )
      .max(VALIDATION.PASSWORD_MAX_LENGTH),
    fullName: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
    phone: phoneSchema.optional(),
  }),
};
