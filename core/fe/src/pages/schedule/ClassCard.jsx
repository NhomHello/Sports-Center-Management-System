import { PERMISSIONS as P } from '@scms/shared';
import { Button, Card, Popconfirm, Space, Tag } from 'antd';
import { CLASS_STATUS, SCHEDULE_STATUS_LABELS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';

/** Card dùng chung cho danh sách lớp mở và phạm vi quản lý. */
export function ClassCard({ item, can, onDetail, onEdit, onCancel, loading, children }) {
  return (
    <Card title={item.name}>
      <Space vertical className="scms-schedule-stack">
        <Tag>{SCHEDULE_STATUS_LABELS[item.status]}</Tag>
        <span>
          {item.subject.name} · {item.room.name}
        </span>
        <span>HLV: {item.coach.fullName}</span>
        <span>
          Còn {item.seatsRemaining}/{item.capacity} chỗ
        </span>
        <span>Mở đăng ký đến {formatDateTime(item.registrationEndAt)}</span>
        <Space wrap>
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
        </Space>
        {children}
      </Space>
    </Card>
  );
}
