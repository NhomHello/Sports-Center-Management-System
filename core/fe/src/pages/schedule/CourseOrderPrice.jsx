import { Typography } from 'antd';
import { formatCurrency } from '@/utils/format';
/** Hiển thị giá giữa khóa từ server, không tự tính lại tiền. */
export function CourseOrderPrice({ item }) {
  if (item.price === undefined || item.price === null) return null;
  if (item.price === 0) return <Typography.Paragraph>Học phí: Miễn phí</Typography.Paragraph>;
  const partial = item.remainingSessions < item.totalSessions;
  return (
    <Typography.Paragraph strong>
      Học phí:{' '}
      {partial
        ? `${formatCurrency(item.priceForRemaining)} cho ${item.remainingSessions} buổi còn lại`
        : `${formatCurrency(item.price)} / ${item.totalSessions} buổi`}
    </Typography.Paragraph>
  );
}
