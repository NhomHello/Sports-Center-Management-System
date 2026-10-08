import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Drawer, Space, Timeline, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import * as service from '@/services/schedule.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from './QueryState';
import { ClassSessionsTable } from './ClassSessionsTable';
import { ClassOverview } from './ClassOverview';

/** Container chi tiết lớp, extension dùng chung cho booking/roster ở FE Khôi. */
export function ClassDetailDrawer({ id, memberId, selectedSession, onClose, renderActions }) {
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
            <ClassOverview item={item} selectedSession={selectedSession} />
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
