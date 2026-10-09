import { Button, Card, Space, Tag } from 'antd';
import { CLASS_STATUS_LABELS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';

/** Card thông tin lớp dùng chung cho danh sách mở và danh sách quản lý. */
export function ClassCard({ item, onDetail, children }) {
  return (
    <Card title={item.name}>
      <Space vertical className="scms-schedule-stack">
        <Tag>{CLASS_STATUS_LABELS[item.status] || item.status}</Tag>
        <span>
          {item.subject.name} · {item.room.name}
        </span>
        <span>Huấn luyện viên: {item.coach.fullName}</span>
        <span>
          Còn {item.seatsRemaining}/{item.capacity} chỗ
        </span>
        <span>Mở đăng ký đến {formatDateTime(item.registrationEndAt)}</span>
        <Space wrap>
          <Button onClick={onDetail}>Chi tiết</Button>
          {children}
        </Space>
      </Space>
    </Card>
  );
}
