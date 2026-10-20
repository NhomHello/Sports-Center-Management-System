import { z } from 'zod';
import { VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có dạng HH:mm');
const frameBody = z
  .object({
    name: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(VALIDATION.NAME_MAX_LENGTH),
    startTime: time,
    endTime: time,
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const frameIdSchema = { params: z.object({ id }) };
export const createFrameSchema = {
  body: frameBody.refine((v) => v.endTime > v.startTime, 'Giờ kết thúc phải sau giờ bắt đầu'),
};
export const updateFrameSchema = {
  params: z.object({ id }),
  body: frameBody
    .partial()
    .refine((v) => Object.keys(v).length > 0, 'Chưa nhập thay đổi')
    .refine(
      (v) => !v.startTime || !v.endTime || v.endTime > v.startTime,
      'Giờ kết thúc phải sau giờ bắt đầu',
    ),
};
