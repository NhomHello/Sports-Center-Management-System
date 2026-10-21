import { z } from 'zod';
import { Enums } from '../../config/db.js';
import { CLASS_LIMITS, VALIDATION } from '../../constants/index.js';
const id = z.coerce.number().int().positive();
const params = z.object({ id });
const reason = z.string().trim().min(1).max(VALIDATION.DESCRIPTION_MAX_LENGTH);
const dateTime = z.iso.datetime({ offset: true });
const range = z
  .object({ startAt: dateTime, endAt: dateTime })
  .strict()
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), 'Giờ kết thúc phải sau bắt đầu');
export const idSchema = { params };
export const reasonSchema = { params, body: z.object({ reason }).strict() };
export const sessionSchema = { params, body: range };
export const coachSchema = {
  params,
  body: z.object({ coachId: id, from: z.iso.date().optional() }).strict(),
};
export const freezeSchema = {
  params,
  body: z
    .object({ from: z.iso.date(), to: z.iso.date() })
    .strict()
    .refine((v) => v.to > v.from, 'Ngày kết thúc phải sau bắt đầu'),
};
export const checkInSchema = {
  body: z.object({ memberId: id, roomTypeId: id.optional() }).strict(),
};
export const attendanceSchema = {
  params,
  body: z
    .object({
      entries: z
        .array(
          z
            .object({
              memberId: id,
              status: z.nativeEnum(Enums.AttendanceStatus),
            })
            .strict(),
        )
        .min(1)
        .max(VALIDATION.NOTIFICATION_IDS_MAX),
    })
    .strict()
    .refine(
      (v) => new Set(v.entries.map((e) => e.memberId)).size === v.entries.length,
      'Hội viên bị lặp',
    ),
};
export const maintenancePreviewSchema = { params, query: range };
export const maintenanceSchema = {
  params,
  body: z
    .object({
      startAt: dateTime,
      endAt: dateTime,
      reason,
      assignments: z
        .array(z.object({ sessionId: id, roomId: id.nullable() }).strict())
        .max(CLASS_LIMITS.MAX_SCHEDULE_DAYS),
    })
    .strict()
    .refine((v) => new Date(v.endAt) > new Date(v.startAt), 'Khoảng bảo trì không hợp lệ')
    .refine(
      (v) => new Set(v.assignments.map((a) => a.sessionId)).size === v.assignments.length,
      'Buổi học bị lặp',
    ),
};
