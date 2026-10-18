import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { VIETNAM_TIME_ZONE } from '@/constants';
import { CLASS_STATUS, SCHEDULE_UI, WEEKDAYS } from '@/constants/schedule';
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
        weeklySchedule: item.weeklySchedule.map((slot) => ({
          ...slot,
          timeRange: [dayjs(`2000-01-01T${slot.startTime}`), dayjs(`2000-01-01T${slot.endTime}`)],
        })),
        startsOn: dayjs(item.startsOn),
        endsOn: dayjs(item.endsOn),
        registrationStartAt: vietnamInput(item.registrationStartAt),
        registrationEndAt: vietnamInput(item.registrationEndAt),
      }
    : { status: CLASS_STATUS.OPEN, weeklySchedule: [{}] };
/** Chỉ gửi field cấu hình lớp, không gửi các DTO/quyền từ màn hình chi tiết. */
export const classFormPayload = (values) => ({
  ...values,
  weeklySchedule: values.weeklySchedule.map(({ timeRange, ...slot }) =>
    timeRange
      ? {
          dayOfWeek: slot.dayOfWeek,
          startTime: timeRange[0].format('HH:mm'),
          endTime: timeRange[1].format('HH:mm'),
        }
      : slot,
  ),
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

export const CLASS_DISPLAY_STATUS = Object.freeze({
  OPEN: { label: 'Mở đăng ký', color: 'blue' },
  UPCOMING: { label: 'Sắp mở đăng ký', color: 'gold' },
  REGISTRATION_ENDED: { label: 'Hết hạn đăng ký', color: 'default' },
  ENDED: { label: 'Đã kết thúc', color: 'default' },
  CLOSED: { label: 'Đóng đăng ký', color: 'default' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
});

/**
 * Trạng thái lớp theo góc nhìn người dùng: lớp OPEN nhưng đã qua hạn đăng ký hoặc đã kết thúc
 * không còn hiện "Mở đăng ký", tránh hội viên bấm vào lớp không đăng ký được.
 * @param {{ status: string, endsOn: string, registrationStartAt?: string, registrationEndAt?: string }} item
 * @param {number} [now] ms
 */
export const classDisplayStatus = (item, now = Date.now()) => {
  if (item.status === CLASS_STATUS.CANCELLED) return CLASS_DISPLAY_STATUS.CANCELLED;
  const endsAt = dayjs.tz(item.endsOn, VIETNAM_TIME_ZONE).endOf('day').valueOf();
  if (endsAt < now) return CLASS_DISPLAY_STATUS.ENDED;
  if (item.status === CLASS_STATUS.CLOSED) return CLASS_DISPLAY_STATUS.CLOSED;
  if (item.registrationStartAt && new Date(item.registrationStartAt).getTime() > now)
    return CLASS_DISPLAY_STATUS.UPCOMING;
  if (item.registrationEndAt && new Date(item.registrationEndAt).getTime() < now)
    return CLASS_DISPLAY_STATUS.REGISTRATION_ENDED;
  return CLASS_DISPLAY_STATUS.OPEN;
};
