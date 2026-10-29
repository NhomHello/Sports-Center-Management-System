import { CoachProfileLink } from '@/pages/profiles/CoachProfileLink';
import { CalendarOutlined } from '@ant-design/icons';
import { Descriptions, Typography } from 'antd';
import { formatDate, formatDateTime } from '@/utils/format';
import { ScheduleStatusTag } from './ScheduleStatusTag';

/** Buổi được mở chỉ là ngữ cảnh xem; điều kiện và thao tác vẫn thuộc toàn lớp. */
export function ClassOverview({ item, selectedSession }) {
  const session = selectedSession && item.sessions.find((entry) => entry.id === selectedSession.id);
  return (
    <>
      {session && (
        <div className="scms-class-session-context">
          <CalendarOutlined aria-hidden="true" />
          <div>
            <strong>Buổi bạn đang xem</strong>
            <span>
              {formatDateTime(session.startAt)} – {formatDateTime(session.endAt)}
            </span>
            <span>
              {session.roomName || item.room.name} · {session.coachName || item.coach.fullName}
            </span>
          </div>
        </div>
      )}
      <Descriptions
        bordered
        column={2}
        items={[
          { key: 'subject', label: 'Bộ môn', children: item.subject.name },
          { key: 'room', label: 'Phòng', children: item.room.name },
          { key: 'teacher', label: 'HLV', children: <CoachProfileLink coach={item.coach} /> },
          {
            key: 'period',
            label: 'Thời gian khóa học',
            children: `${formatDate(item.startsOn)} – ${formatDate(item.endsOn)}`,
          },
          {
            key: 'cancel-deadline',
            label: 'Hạn hủy buổi gần nhất',
            children:
              formatDateTime(item.cancellationExceptionUntil || item.cancelDeadline) ||
              'Theo quy định của lớp',
          },
          {
            key: 'slots',
            label: 'Chỗ còn lại',
            children: `${item.seatsRemaining}/${item.capacity}${item.heldSeats > 0 ? ` (đang giữ chỗ ${item.heldSeats})` : ''}`,
          },
          {
            key: 'window',
            label: 'Đăng ký',
            children: `${formatDateTime(item.registrationStartAt)} – ${formatDateTime(item.registrationEndAt)}`,
          },
          {
            key: 'status',
            label: 'Trạng thái',
            children: <ScheduleStatusTag status={item.status} />,
          },
        ]}
      />
      {item.description && <Typography.Paragraph>{item.description}</Typography.Paragraph>}
      <p className="scms-class-action-scope">
        Đăng ký và hủy áp dụng cho toàn bộ các buổi còn lại của lớp.
      </p>
    </>
  );
}
