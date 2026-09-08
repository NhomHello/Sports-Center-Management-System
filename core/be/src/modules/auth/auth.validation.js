import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

const email = z.email('Email không hợp lệ').trim().toLowerCase();

export const loginSchema = {
  body: z.object({
    email,
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  }),
};

export const registerSchema = {
  body: z.object({
    email,
    password: z
      .string()
      .min(
        VALIDATION.PASSWORD_MIN_LENGTH,
        `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`,
      )
      .max(VALIDATION.PASSWORD_MAX_LENGTH),
    fullName: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
    phone: z.string().trim().regex(VALIDATION.PHONE_REGEX, 'Số điện thoại không hợp lệ').optional(),
  }),
};
