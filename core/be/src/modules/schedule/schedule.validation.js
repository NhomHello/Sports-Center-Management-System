import { z } from 'zod';
import { vietnamMidnight } from '../class/class-schedule.service.js';
const weekStart = z.iso
  .date()
  .refine((v) => new Date(v).getUTCDay() === 1, 'weekStart phải là ngày thứ Hai theo giờ Việt Nam');
export const scheduleWeekSchema = { query: z.object({ weekStart }).strict() };
/** Biên đầu tuần dùng timezone Việt Nam, không theo máy chủ. */
export const startOfWeek = (date) => vietnamMidnight(date);
