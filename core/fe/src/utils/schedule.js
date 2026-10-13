import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { VIETNAM_TIME_ZONE } from '@/constants';
import { SCHEDULE_UI, WEEKDAYS } from '@/constants/schedule';
dayjs.extend(utc);
dayjs.extend(timezone);
/** DatePicker giữ wall time Việt Nam, không lấy offset của máy người dùng. */
export const vietnamInput = (value) => dayjs(value).tz(VIETNAM_TIME_ZONE);
/** Ngày chọn trên DatePicker là ngày Việt Nam, không phải midnight theo múi giờ trình duyệt. */
export const vietnamCalendarDate = (value) =>
  dayjs.tz(value.format(SCHEDULE_UI.DATE_PATTERN), VIETNAM_TIME_ZONE);
/** Biến ngày được chọn trong form thành timestamp có offset Việt Nam. */
export const vietnamTimestamp = (value) => `${value.format(SCHEDULE_UI.DATETIME_PATTERN)}+07:00`;
/** Ngày thứ Hai đầu tuần Việt Nam, kể cả Chủ nhật hoặc thời điểm sát UTC midnight. */
export const vietnamWeekStart = (value = dayjs()) => {
  const local = value.tz(VIETNAM_TIME_ZONE);
  const offset = (local.day() + SCHEDULE_UI.LAST_WEEKDAY) % SCHEDULE_UI.DAYS_PER_WEEK;
  return local.subtract(offset, 'day').startOf('day');
};
/** Giá trị DatePicker của lớp đang sửa. */
export const classFormValues = (item) =>
  item
    ? {
        ...item,
        startsOn: dayjs(item.startsOn),
        endsOn: dayjs(item.endsOn),
        registrationStartAt: vietnamInput(item.registrationStartAt),
        registrationEndAt: vietnamInput(item.registrationEndAt),
      }
    : { weeklySchedule: [{}] };
/** Chỉ gửi field cấu hình lớp, không gửi các DTO/quyền từ màn hình chi tiết. */
export const classFormPayload = (values) => ({
  ...values,
  startsOn: values.startsOn.format(SCHEDULE_UI.DATE_PATTERN),
  endsOn: values.endsOn.format(SCHEDULE_UI.DATE_PATTERN),
  registrationStartAt: vietnamTimestamp(values.registrationStartAt),
  registrationEndAt: vietnamTimestamp(values.registrationEndAt),
});

const weekdayLabel = (value) => WEEKDAYS.find((weekday) => weekday.value === value)?.label ?? '';

/**
 * "Thứ Hai, Thứ Tư · 18:00–19:00" từ weeklySchedule; các thứ cùng khung giờ được gộp.
 * @param {{ dayOfWeek: number, startTime: string, endTime: string }[]} slots
 * @returns {string[]} mỗi phần tử là một khung giờ
 */
export const describeWeeklySchedule = (slots = []) => {
  const monday = SCHEDULE_UI.MONDAY;
  const order = (day) => (day - monday + SCHEDULE_UI.DAYS_PER_WEEK) % SCHEDULE_UI.DAYS_PER_WEEK;
  const groups = new Map();
  [...slots]
    .sort(
      (a, b) => order(a.dayOfWeek) - order(b.dayOfWeek) || a.startTime.localeCompare(b.startTime),
    )
    .forEach(({ dayOfWeek, startTime, endTime }) => {
      const range = `${startTime}–${endTime}`;
      groups.set(range, [...(groups.get(range) ?? []), weekdayLabel(dayOfWeek)]);
    });
  return [...groups].map(([range, days]) => `${days.join(', ')} · ${range}`);
};
