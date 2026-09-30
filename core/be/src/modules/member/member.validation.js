import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

export const createMemberSchema = {
  body: z.object({
    fullName: z
      .string()
      .trim()
      .min(VALIDATION.NAME_MIN_LENGTH, 'Họ tên quá ngắn')
      .max(VALIDATION.NAME_MAX_LENGTH, 'Họ tên quá dài'),

    email: z.string().trim().email('Email không hợp lệ'),

    phone: z.string().trim().regex(VALIDATION.PHONE_REGEX, 'Số điện thoại không hợp lệ'),

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
