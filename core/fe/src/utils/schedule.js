import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { VIETNAM_TIME_ZONE } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
dayjs.extend(utc);
dayjs.extend(timezone);
/** DatePicker giữ wall time Việt Nam, không lấy offset của máy người dùng. */
export const vietnamInput = (value) => dayjs(value).tz(VIETNAM_TIME_ZONE);
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
