import { vietnamDate } from '../../common/utils/vietnam-date.js';
import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { PROFILE_LIMITS as L, PROFILE_LEVELS, PROFILE_GENDERS } from '../../constants/sprint4.js';
const text = z.string().trim().max(L.TEXT_MAX);
const phone = z
  .string()
  .trim()
  .regex(/^(0|\+84)\d{9}$/u, 'Số điện thoại không hợp lệ')
  .nullable();
export const idSchema = { params: z.object({ id: z.coerce.number().int().positive() }) };
export const coachListSchema = {
  query: paginationQuerySchema
    .extend({
      q: z.string().trim().max(L.CERTIFICATE_LENGTH).optional(),
      subjectId: z.coerce.number().int().positive().optional(),
    })
    .strict(),
};
export const studentListSchema = {
  query: paginationQuerySchema.extend({ q: text.optional() }).strict(),
};
export const coachBody = z
  .object({
    bio: z.string().trim().max(L.BIO_STORAGE_MAX),
    experienceYears: z.number().int().min(0).max(L.EXPERIENCE_MAX),
    certifications: z
      .array(z.string().trim().min(1).max(L.CERTIFICATE_LENGTH))
      .max(L.CERTIFICATE_MAX),
    publicEmail: z.email().trim().toLowerCase().nullable(),
    publicPhone: phone,
    zalo: phone,
    showContact: z.boolean(),
  })
  .strict()
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Chưa có thay đổi');
export const coachSchema = { body: coachBody };
export const memberBody = z
  .object({
    birthDate: z.iso
      .date()
      .refine((s) => s <= vietnamDate(), 'Ngày sinh không được ở tương lai')
      .nullable(),
    gender: z.enum(PROFILE_GENDERS).nullable(),
    heightCm: z.number().min(L.HEIGHT_MIN).max(L.HEIGHT_MAX).nullable(),
    weightKg: z.number().min(L.WEIGHT_MIN).max(L.WEIGHT_MAX).nullable(),
    goals: text,
    level: z.enum(PROFILE_LEVELS),
    healthNotes: text,
    emergencyName: z.string().trim().max(L.CERTIFICATE_LENGTH).nullable(),
    emergencyPhone: phone,
    shareWithCoach: z.boolean(),
  })
  .strict()
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Chưa có thay đổi');
export const memberSchema = { body: memberBody };
export const staffMemberSchema = { ...idSchema, body: memberBody };
