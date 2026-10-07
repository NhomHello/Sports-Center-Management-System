import { z } from 'zod';
import {
  fullNameField,
  emailField,
  phoneField,
  passwordField,
} from '../../common/validators/account-fields.js';

const email = emailField;
const loginIdentity = z.union([emailField, phoneField]);
export const loginSchema = {
  body: z.object({
    email: loginIdentity,
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  }),
};

export const registerSchema = {
  body: z.object({
    email,
    password: passwordField,
    fullName: fullNameField,
    phone: phoneField.optional(),
  }),
};

export const changePasswordSchema = {
  body: z
    .object({
      currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
      password: passwordField,
    })
    .strict()
    .refine((data) => data.currentPassword !== data.password, {
      path: ['password'],
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    }),
};

// Tương thích tên contract đã dùng trong test/handover của nhánh backend.
export const passwordChangeSchema = changePasswordSchema;

export const requestEmailVerificationSchema = {
  body: z.object({ email }).strict(),
};

export const confirmEmailVerificationSchema = {
  body: z
    .object({
      token: z
        .string()
        .trim()
        .regex(/^[a-f0-9]{64}$/, 'Liên kết không hợp lệ'),
    })
    .strict(),
};
