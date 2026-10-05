import { Button, Card, Space, Tag, Typography } from 'antd';
import { SCHEDULE_STATUS_LABELS, SESSION_STATUS } from '@/constants/schedule';
import { formatDateTime } from '@/utils/format';
/** Danh sách buổi của một ngày, room/coach lấy snapshot của buổi. */
export function ScheduleList({ events, onDetail, renderActions }) {
  if (!events.length) return <Typography.Text type="secondary">Không có buổi học</Typography.Text>;
  return (
    <Space vertical className="scms-schedule-stack">
      {events.map((event) => (
        <Card key={event.id} size="small">
          <Space vertical className="scms-schedule-stack">
            <Typography.Text strong>{event.className}</Typography.Text>
            <Tag>{SCHEDULE_STATUS_LABELS[event.status]}</Tag>
            {event.enrollmentStatus && <Tag>{SCHEDULE_STATUS_LABELS[event.enrollmentStatus]}</Tag>}
            <span>
              {formatDateTime(event.startAt)} – {formatDateTime(event.endAt)}
            </span>
            <span>
              {event.room} · {event.coach}
            </span>
            {event.gymClass.sessions.some((s) => s.status === SESSION_STATUS.CANCELLED) && (
              <Tag color="orange">Lịch đã thay đổi / huỷ</Tag>
            )}
            <Button onClick={() => onDetail(event.classId)}>Chi tiết lớp</Button>
            {renderActions(event.gymClass)}
          </Space>
        </Card>
      ))}
    </Space>
  );
}
