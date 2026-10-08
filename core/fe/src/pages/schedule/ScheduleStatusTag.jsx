import { Tag } from 'antd';
import {
  CLASS_STATUS,
  ENROLLMENT_STATUS,
  SESSION_STATUS,
  SCHEDULE_STATUS_LABELS,
} from '@/constants/schedule';

const STATUS_COLORS = Object.freeze({
  [CLASS_STATUS.OPEN]: 'blue',
  [ENROLLMENT_STATUS.BOOKED]: 'green',
  [SESSION_STATUS.COMPLETED]: 'default',
  [CLASS_STATUS.CANCELLED]: 'red',
});

/** Màu bổ trợ nhãn chữ để trạng thái vẫn dễ phân biệt khi không nhìn màu. */
export function ScheduleStatusTag({ status, label }) {
  return (
    <Tag color={STATUS_COLORS[status] || 'default'}>{label || SCHEDULE_STATUS_LABELS[status]}</Tag>
  );
}
