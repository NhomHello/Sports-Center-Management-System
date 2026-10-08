import { ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { SESSION_STATUS } from '@/constants/schedule';
import { vietnamInput } from '@/utils/schedule';
import { ScheduleStatusTag } from './ScheduleStatusTag';

/** Thời gian gọn trong cột ngày; mọi thao tác đăng ký vẫn áp dụng cho toàn lớp. */
export function ScheduleEventCard({ event, onDetail, renderActions }) {
  const hasEnded = event.status === SESSION_STATUS.SCHEDULED && new Date(event.endAt) < new Date();
  const hasChanges = event.gymClass.sessions.some(
    (session) => session.status === SESSION_STATUS.CANCELLED,
  );
  return (
    <Card
      size="small"
      className={`scms-calendar-event ${hasEnded ? 'scms-calendar-event--past' : ''}`}
    >
      <div className="scms-calendar-event__time">
        <ClockCircleOutlined />
        <span>
          {vietnamInput(event.startAt).format(DATE_FORMATS.TIME)} –{' '}
          {vietnamInput(event.endAt).format(DATE_FORMATS.TIME)}
        </span>
      </div>
      <strong className="scms-calendar-event__title">{event.className}</strong>
      <div className="scms-calendar-event__tags">
        <ScheduleStatusTag status={event.status} label={hasEnded ? 'Đã diễn ra' : undefined} />
        {event.enrollmentStatus && <ScheduleStatusTag status={event.enrollmentStatus} />}
        {hasChanges && <Tag color="orange">Lịch đã thay đổi / huỷ</Tag>}
      </div>
      <div className="scms-calendar-event__meta">
        <EnvironmentOutlined />
        <span title={event.room}>{event.room}</span>
      </div>
      <div className="scms-calendar-event__meta scms-calendar-event__coach">
        <UserOutlined />
        <span title={event.coach}>{event.coach}</span>
      </div>
      <div className="scms-calendar-event__actions">
        <Button onClick={() => onDetail(event)}>Chi tiết lớp</Button>
        {renderActions?.(event.gymClass)}
      </div>
    </Card>
  );
}
