import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Descriptions, Drawer, Space, Tag, Timeline, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_STATUS_LABELS } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from './QueryState';
import { ClassSessionsTable } from './ClassSessionsTable';

/** Container chi tiết lớp, extension dùng chung cho booking/roster ở FE Khôi. */
export function ClassDetailDrawer({ id, memberId, onClose, renderActions }) {
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'detail', id, memberId],
    queryFn: () => service.getClass(id, { memberId }),
  });
  const item = query.data?.data;
  return (
    <Drawer open title={item?.name || 'Chi tiết lớp'} onClose={onClose} size="large">
      <QueryState query={query}>
        {item && (
          <Space vertical className="scms-schedule-stack">
            <Descriptions
              column={1}
              items={[
                { key: 'subject', label: 'Bộ môn', children: item.subject.name },
                { key: 'room', label: 'Phòng', children: item.room.name },
                { key: 'teacher', label: 'HLV', children: item.coach.fullName },
                {
                  key: 'slots',
                  label: 'Chỗ còn lại',
                  children: `${item.seatsRemaining}/${item.capacity}`,
                },
                {
                  key: 'window',
                  label: 'Đăng ký',
                  children: `${formatDateTime(item.registrationStartAt)} – ${formatDateTime(item.registrationEndAt)}`,
                },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children: <Tag>{SCHEDULE_STATUS_LABELS[item.status]}</Tag>,
                },
              ]}
            />
            <Typography.Paragraph>{item.description}</Typography.Paragraph>
            {renderActions?.(item)}
            <Typography.Title level={5}>Các buổi học</Typography.Title>
            <ClassSessionsTable sessions={item.sessions} />
            <Typography.Title level={5}>Thay đổi lịch</Typography.Title>
            {item.events?.length ? (
              <Timeline
                items={item.events.map((event) => ({
                  key: event.id,
                  title: `${event.title} · ${formatDateTime(event.createdAt)}`,
                  content: event.message,
                }))}
              />
            ) : (
              <Typography.Text type="secondary">Chưa có thay đổi lịch</Typography.Text>
            )}
          </Space>
        )}
      </QueryState>
    </Drawer>
  );
}
