import { PERMISSIONS as P } from '@scms/shared';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Popconfirm, Tag } from 'antd';
import { CLASS_STATUS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';
import { ScheduleStatusTag } from './ScheduleStatusTag';

/** Card dùng chung cho danh sách lớp mở và phạm vi quản lý. */
export function ClassCard({ item, can, onDetail, onEdit, onCancel, loading, children }) {
  return (
    <Card title={item.name} className="scms-class-card">
      <div className="scms-class-card__body">
        <div className="scms-class-card__tags">
          <ScheduleStatusTag status={item.status} />
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
        <div className="scms-class-card__actions">
          <Button onClick={onDetail}>Chi tiết</Button>
          {can(P.CLASS_UPDATE) && item.status !== CLASS_STATUS.CANCELLED && (
            <Button onClick={onEdit}>Sửa lớp</Button>
          )}
          {can(P.CLASS_DELETE) && item.status !== CLASS_STATUS.CANCELLED && (
            <Popconfirm
              title="Huỷ toàn bộ lớp và thông báo hội viên?"
              okText="Huỷ lớp"
              cancelText="Giữ lớp"
              onConfirm={onCancel}
            >
              <Button danger loading={loading}>
                Huỷ lớp
              </Button>
            </Popconfirm>
          )}
        </div>
        {children}
      </div>
    </Card>
  );
}
