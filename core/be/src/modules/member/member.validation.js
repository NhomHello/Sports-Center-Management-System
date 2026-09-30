import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

const memberIdParam = z.object({
  id: z.coerce.number().int().positive(),
});

const emailSchema = z
  .string()
  .trim()
  .email('Email không hợp lệ')
  .transform((value) => value.toLowerCase());

const phoneSchema = z.string().trim().regex(VALIDATION.PHONE_REGEX, 'Số điện thoại không hợp lệ');

const memberProfileFields = {
  fullName: z
    .string()
    .trim()
    .min(VALIDATION.NAME_MIN_LENGTH, 'Họ tên quá ngắn')
    .max(VALIDATION.NAME_MAX_LENGTH, 'Họ tên quá dài'),

  email: emailSchema.optional(),

  phone: phoneSchema,
};

export const createMemberSchema = {
  body: z.object({
    ...memberProfileFields,

    password: z
      .string()
      .min(VALIDATION.PASSWORD_MIN_LENGTH, 'Mật khẩu quá ngắn')
      .max(VALIDATION.PASSWORD_MAX_LENGTH, 'Mật khẩu quá dài'),
  }),
};

export const listMembersSchema = {
  query: paginationQuerySchema.extend({
    search: z
      .string()
      .trim()
      .max(VALIDATION.SEARCH_MAX_LENGTH, 'Từ khóa tìm kiếm quá dài')
      .optional(),
  }),
};

export const memberIdSchema = {
  params: memberIdParam,
};

export const updateMemberSchema = {
  params: memberIdParam,

  body: z
    .object({
      fullName: memberProfileFields.fullName.optional(),
      email: emailSchema.optional(),
      phone: phoneSchema.optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      'Cần cung cấp ít nhất một thông tin để cập nhật',
    ),
};
