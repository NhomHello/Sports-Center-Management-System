import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { VALIDATION } from '../../constants/index.js';

const PLAN_CODE_MAX_LENGTH = 50;
const BENEFIT_MAX_LENGTH = 200;
const BENEFITS_MAX_ITEMS = 12;

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const planFields = {
  code: z
    .string()
    .trim()
    .min(1, 'Mã gói không được để trống')
    .max(PLAN_CODE_MAX_LENGTH, 'Mã gói quá dài')
    .regex(/^[A-Z0-9_]+$/, 'Mã gói chỉ gồm chữ in hoa, số và dấu gạch dưới'),
  name: z
    .string()
    .trim()
    .min(VALIDATION.NAME_MIN_LENGTH, 'Tên gói quá ngắn')
    .max(VALIDATION.NAME_MAX_LENGTH, 'Tên gói quá dài'),
  description: z.string().trim().max(VALIDATION.DESCRIPTION_MAX_LENGTH, 'Mô tả quá dài').optional(),
  price: z.coerce.number().int().positive('Giá gói phải lớn hơn 0'),
  durationDays: z.coerce.number().int().positive('Thời hạn gói phải lớn hơn 0'),
  benefits: z
    .array(z.string().trim().min(1).max(BENEFIT_MAX_LENGTH))
    .max(BENEFITS_MAX_ITEMS)
    .optional(),
  isActive: z.boolean().optional(),
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
    code: planFields.code.optional(),
    name: planFields.name.optional(),
    description: planFields.description,
    price: planFields.price.optional(),
    durationDays: planFields.durationDays.optional(),
    benefits: planFields.benefits,
    isActive: planFields.isActive,
  }),
};
