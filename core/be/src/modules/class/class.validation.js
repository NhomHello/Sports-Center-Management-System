import { z } from 'zod';
import { paginationQuerySchema } from '../../common/utils/pagination.js';
import { Enums } from '../../config/db.js';
import { CLASS_LIMITS, VALIDATION } from '../../constants/index.js';

const id = z.coerce.number().int().positive();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ phải có dạng HH:mm');
const weeklySlot = z
  .object({
    dayOfWeek: z.number().int().min(0).max(CLASS_LIMITS.LAST_WEEKDAY),
    startTime: time,
    endTime: time,
  })
  .strict()
  .refine((v) => v.endTime > v.startTime, 'Giờ kết thúc phải sau giờ bắt đầu');
export const classIdSchema = { params: z.object({ id }) };
export const classBody = z
  .object({
    name: z.string().trim().min(VALIDATION.NAME_MIN_LENGTH).max(CLASS_LIMITS.NAME_LENGTH),
    description: z.string().trim().max(CLASS_LIMITS.DESCRIPTION_LENGTH).nullable().optional(),
    subjectId: id,
    roomId: id,
    coachId: id,
    capacity: id,
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
    weeklySchedule: z.array(weeklySlot).min(1).max(CLASS_LIMITS.DAYS_PER_WEEK),
    registrationStartAt: z.iso.datetime({ offset: true }),
    registrationEndAt: z.iso.datetime({ offset: true }),
    status: z.enum([Enums.ClassStatus.OPEN, Enums.ClassStatus.CLOSED]).optional(),
  })
  .strict()
  .refine((v) => v.endsOn >= v.startsOn, 'Ngày kết thúc phải sau ngày bắt đầu')
  .refine(
    (v) => new Date(v.registrationEndAt) > new Date(v.registrationStartAt),
    'Thời gian đóng đăng ký phải sau thời gian mở',
  );
export const createClassSchema = { body: classBody };
export const updateClassSchema = { ...classIdSchema, body: classBody };
export const listClassSchema = {
  query: paginationQuerySchema.extend({
    search: z.string().trim().max(VALIDATION.SEARCH_MAX_LENGTH).optional(),
    subjectId: id.optional(),
    coachId: id.optional(),
    date: z.iso.date().optional(),
    status: z.nativeEnum(Enums.ClassStatus).optional(),
    scope: z.enum(['open', 'management']).default('open'),
  }),
};
