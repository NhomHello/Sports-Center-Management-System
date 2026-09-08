import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { Enums } from '../../config/db.js';
import { VALIDATION } from '../../constants/index.js';

const idParam = z.object({ id: z.coerce.number().int().positive() });

export const listUsersSchema = {
  query: paginationQuerySchema.extend({
    search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional(),
    roleId: z.coerce.number().int().positive().optional(),
    status: z.enum(Object.values(Enums.UserStatus)).optional(),
  }),
};

export const userIdSchema = { params: idParam };

export const createUserSchema = {
  body: z.object({
    email: z.email('Email không hợp lệ').trim().toLowerCase(),
    password: z
      .string()
      .min(
        VALIDATION.PASSWORD_MIN_LENGTH,
        `Mật khẩu tối thiểu ${VALIDATION.PASSWORD_MIN_LENGTH} ký tự`,
      )
      .max(VALIDATION.PASSWORD_MAX_LENGTH),
    fullName: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
    phone: z.string().trim().regex(VALIDATION.PHONE_REGEX, 'Số điện thoại không hợp lệ').optional(),
    roleId: z.number().int().positive(),
  }),
};

export const updateUserRoleSchema = {
  params: idParam,
  body: z.object({ roleId: z.number().int().positive() }),
};

export const updateUserStatusSchema = {
  params: idParam,
  body: z.object({ status: z.enum(Object.values(Enums.UserStatus)) }),
};
