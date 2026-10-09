import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { VIETNAM_TIME_ZONE } from '@/constants';
import { CLASS_STATUS, SCHEDULE_UI } from '@/constants/schedule';

dayjs.extend(utc);
dayjs.extend(timezone);

/** Đưa thời điểm từ API về giá trị DatePicker theo giờ Việt Nam. */
export const vietnamInput = (value) => dayjs(value).tz(VIETNAM_TIME_ZONE);

/** Đổi thời điểm trong form thành ISO 8601 có múi giờ Việt Nam. */
export const vietnamTimestamp = (value) => `${value.format(SCHEDULE_UI.DATETIME_PATTERN)}+07:00`;

/** Chuẩn bị dữ liệu ban đầu cho form tạo hoặc sửa lớp. */
export const classFormValues = (item) =>
  item
    ? {
        ...item,
        startsOn: dayjs(item.startsOn),
        endsOn: dayjs(item.endsOn),
        registrationStartAt: vietnamInput(item.registrationStartAt),
        registrationEndAt: vietnamInput(item.registrationEndAt),
      }
    : { status: CLASS_STATUS.OPEN, weeklySchedule: [{}] };

/** Chỉ gửi các trường cấu hình lớp mà API cho phép. */
export const classFormPayload = (values) => ({
  name: values.name,
  description: values.description,
  subjectId: values.subjectId,
  roomId: values.roomId,
  coachId: values.coachId,
  capacity: values.capacity,
  status: values.status,
  weeklySchedule: values.weeklySchedule,
  startsOn: values.startsOn.format(SCHEDULE_UI.DATE_PATTERN),
  endsOn: values.endsOn.format(SCHEDULE_UI.DATE_PATTERN),
  registrationStartAt: vietnamTimestamp(values.registrationStartAt),
  registrationEndAt: vietnamTimestamp(values.registrationEndAt),
});
