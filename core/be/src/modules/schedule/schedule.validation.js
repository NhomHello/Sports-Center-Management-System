import { z } from 'zod';
import { addDays, todayVn } from '../../common/utils/vn-date.js';
import { SCHEDULE, TIME } from '../../constants/index.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có dạng YYYY-MM-DD');

const spanInDays = ({ from, to }) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / TIME.MS_PER_DAY;

/** Khoảng ngày theo giờ Việt Nam: mặc định 7 ngày từ hôm nay, tối đa 62 ngày. */
const rangeSchema = (extraFields = {}) =>
  z
    .object({ from: isoDate.optional(), to: isoDate.optional(), ...extraFields })
    .transform(({ from, to, ...rest }) => {
      const start = from ?? todayVn();
      return { ...rest, from: start, to: to ?? addDays(start, SCHEDULE.DEFAULT_RANGE_DAYS - 1) };
    })
    .refine((range) => spanInDays(range) >= 0, {
      path: ['to'],
      message: 'Ngày kết thúc phải từ ngày bắt đầu',
    })
    .refine((range) => spanInDays(range) < SCHEDULE.MAX_RANGE_DAYS, {
      path: ['to'],
      message: `Chỉ xem tối đa ${SCHEDULE.MAX_RANGE_DAYS} ngày một lần`,
    });

export const mySchedulesSchema = { query: rangeSchema() };

export const teachingScheduleSchema = {
  query: rangeSchema({ coachId: z.coerce.number().int().positive().optional() }),
};
