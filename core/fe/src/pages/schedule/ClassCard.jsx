import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Space, Tag } from 'antd';
import { CLASS_STATUS_LABELS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';

/** Card thông tin lớp dùng chung cho danh sách mở và danh sách quản lý. */
export function ClassCard({ item, onDetail, children }) {
  return (
    <Card title={item.name} className="scms-class-card">
      <div className="scms-class-card__body">
        <div className="scms-class-card__tags">
          <Tag color={item.status === 'CANCELLED' ? 'red' : 'blue'}>
            {CLASS_STATUS_LABELS[item.status] || item.status}
          </Tag>
          <Tag>{item.subject.name}</Tag>
        </div>
        <div className="scms-class-card__meta">
          <EnvironmentOutlined />
          <span>{item.room.name}</span>
        </div>
        <div className="scms-class-card__meta">
          <UserOutlined />
          <span>HLV: {item.coach.fullName}</span>
        </div>
        <div className="scms-class-card__availability">
          <TeamOutlined />
          <strong>
            Còn {item.seatsRemaining}/{item.capacity} chỗ
          </strong>
        </div>
        <div className="scms-class-card__deadline">
          <ClockCircleOutlined />
          <span>Mở đăng ký đến {formatDateTime(item.registrationEndAt)}</span>
        </div>
        <Space wrap className="scms-class-card__actions">
          <Button onClick={onDetail}>Chi tiết</Button>
          {children}
        </Space>
      </div>
    </Card>
  );
}
