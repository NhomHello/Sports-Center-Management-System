import { Tag } from 'antd';
import {
  CLASS_STATUS,
  ENROLLMENT_STATUS,
  SESSION_STATUS,
  SCHEDULE_STATUS_LABELS,
} from '@/constants/schedule';

const STATUS_COLORS = Object.freeze({
  [CLASS_STATUS.OPEN]: 'blue',
  [SESSION_STATUS.SCHEDULED]: 'blue',
  [ENROLLMENT_STATUS.BOOKED]: 'green',
  [SESSION_STATUS.COMPLETED]: 'default',
  [CLASS_STATUS.CANCELLED]: 'red',
});

/** Màu bổ trợ nhãn chữ để trạng thái vẫn dễ phân biệt khi không nhìn màu. */
export function ScheduleStatusTag({ status, label, endAt }) {
  const effective =
    status === SESSION_STATUS.SCHEDULED && new Date(endAt) <= new Date()
      ? SESSION_STATUS.COMPLETED
      : status;
  return (
    <Tag color={STATUS_COLORS[effective] || 'default'}>
      {label || SCHEDULE_STATUS_LABELS[effective]}
    </Tag>
  );
}
