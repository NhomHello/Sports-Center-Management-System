import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const planFields = {
  name: z
    .string()
    .trim()
    .min(VALIDATION.NAME_MIN_LENGTH, 'Tên gói quá ngắn')
    .max(VALIDATION.NAME_MAX_LENGTH, 'Tên gói quá dài'),
  description: z.string().trim().max(VALIDATION.DESCRIPTION_MAX_LENGTH, 'Mô tả quá dài').optional(),
  price: z.coerce.number().int().positive('Giá gói phải lớn hơn 0'),
  durationDays: z.coerce.number().int().positive('Thời hạn gói phải lớn hơn 0'),
};

export const listMembershipPlanSchema = {
  query: paginationQuerySchema,
};

export const membershipPlanIdSchema = {
  params: idParam,
};

export const createMembershipPlanSchema = {
  body: z.object(planFields),
};

export const updateMembershipPlanSchema = {
  params: idParam,
  body: z.object({
    name: planFields.name.optional(),
    description: planFields.description,
    price: planFields.price.optional(),
    durationDays: planFields.durationDays.optional(),
  }),
};
