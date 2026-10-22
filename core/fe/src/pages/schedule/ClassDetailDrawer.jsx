import { useState } from 'react';
import { PERMISSIONS as P } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { CoachChangeModal } from './CoachChangeModal';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { Button, Drawer, Space, Timeline, Typography } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { CLASS_STATUS } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from './QueryState';
import { ClassSessionsTable } from './ClassSessionsTable';
import { ClassOverview } from './ClassOverview';

/** Lớp đã hủy không còn buổi nào để chuyển HLV. */
const canChangeCoach = (can, item) =>
  can(P.CLASS_UPDATE) && item?.status !== CLASS_STATUS.CANCELLED;

const renderFooter = (item, renderActions) => (item ? renderActions?.(item) : null);

/** Container chi tiết lớp, extension dùng chung cho booking/roster ở FE Khôi. */
export function ClassDetailDrawer({ id, memberId, selectedSession, onClose, renderActions }) {
  const { can } = usePermission();
  const [coachOpen, setCoachOpen] = useState(false);
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'detail', id, memberId],
    queryFn: () => service.getClass(id, { memberId }),
  });
  const item = query.data?.data;
  return (
    <Drawer
      open
      className="scms-class-detail"
      title={item?.name || 'Chi tiết lớp'}
      onClose={onClose}
      size="min(960px, 100vw)"
      footer={renderFooter(item, renderActions)}
      extra={
        canChangeCoach(can, item) && (
          <Button onClick={() => setCoachOpen(true)}>Đổi HLV phụ trách</Button>
        )
      }
    >
      <QueryState query={query}>
        {item && (
          <Space vertical className="scms-schedule-stack">
            <ClassOverview item={item} selectedSession={selectedSession} />
            <Typography.Title level={5}>Các buổi học</Typography.Title>
            <ClassSessionsTable sessions={item.sessions} memberCount={item.enrolledCount} />
            {coachOpen && <CoachChangeModal item={item} onClose={() => setCoachOpen(false)} />}
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
