import { ClockCircleOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { SESSION_STATUS } from '@/constants/schedule';
import { vietnamInput } from '@/utils/schedule';
import { TeachingEventActions } from './TeachingEventActions';
import { ScheduleStatusTag } from './ScheduleStatusTag';
import { ExcuseButton } from './ExcuseButton';

function EventTags({ event }) {
  const changed = event.status === SESSION_STATUS.CANCELLED || Boolean(event.rescheduledAt);
  return (
    <div className="scms-calendar-event__tags">
      <ScheduleStatusTag status={event.status} endAt={event.endAt} />
      {event.enrollmentStatus && <ScheduleStatusTag status={event.enrollmentStatus} />}
      {changed && <Tag color="orange">Lịch đã thay đổi / hủy</Tag>}
    </div>
  );
}

function EventActions({ event, kind, onDetail, renderActions }) {
  return (
    <div className="scms-calendar-event__actions">
      <Button onClick={() => onDetail(event)}>Chi tiết lớp</Button>
      {kind !== 'teaching' && renderActions?.(event.gymClass)}
      {kind === 'own' && event.enrollmentStatus === 'BOOKED' && (
        <ExcuseButton key={`${event.id}-${event.attendanceStatus ?? ''}`} session={event} />
      )}
    </div>
  );
}

/** Thời gian gọn trong cột ngày; mọi thao tác đăng ký vẫn áp dụng cho toàn lớp. */
export function ScheduleEventCard({ event, onDetail, renderActions, kind }) {
  const hasEnded = event.status === SESSION_STATUS.SCHEDULED && new Date(event.endAt) < new Date();
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
      <EventTags event={event} />
      <div className="scms-calendar-event__meta">
        <EnvironmentOutlined />
        <span title={event.room}>{event.room}</span>
      </div>
      {kind !== 'teaching' && (
        <div className="scms-calendar-event__meta scms-calendar-event__coach">
          <UserOutlined />
          <span title={event.coach}>{event.coach}</span>
        </div>
      )}
      {kind === 'teaching' && (
        <>
          <p>
            Đã đăng ký {event.gymClass.enrolledCount}/{event.gymClass.capacity}
          </p>
          <TeachingEventActions event={event} />
        </>
      )}
      <EventActions event={event} kind={kind} onDetail={onDetail} renderActions={renderActions} />
    </Card>
  );
}
