import { useState } from 'react';
import { Space, Typography } from 'antd';
import { SCHEDULE_UI } from '@/constants/schedule';
import { vietnamInput } from '@/utils/schedule';
import { useScheduleCalendar } from './useScheduleCalendar';
import { ClassBookingActions } from './ClassBookingActions';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { QueryState } from './QueryState';
import { ScheduleList } from './ScheduleList';
import { ScheduleToolbar } from './ScheduleToolbar';

/** Lịch ngày/tuần riêng biệt cho hội viên, HLV và quản lý. */
export function ScheduleCalendar({ kind }) {
  const calendar = useScheduleCalendar(kind);
  const [detailId, setDetailId] = useState(null);
  const actions = (item) => <ClassBookingActions item={item} />;
  return (
    <Space vertical className="scms-schedule-stack">
      <ScheduleToolbar calendar={calendar} />
      <QueryState query={calendar.query}>
        <div className={calendar.mode === 'week' ? 'scms-week-grid' : 'scms-day-grid'}>
          {calendar.days.map((day) => {
            const date = day.format(SCHEDULE_UI.DATE_PATTERN);
            return (
              <section className="scms-schedule-day" key={date}>
                <Typography.Title level={5}>{day.format('DD/MM')}</Typography.Title>
                <ScheduleList
                  events={calendar.events.filter(
                    (e) => vietnamInput(e.startAt).format(SCHEDULE_UI.DATE_PATTERN) === date,
                  )}
                  onDetail={setDetailId}
                  renderActions={actions}
                />
              </section>
            );
          })}
        </div>
      </QueryState>
      {detailId && (
        <ClassDetailDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          renderActions={actions}
        />
      )}
    </Space>
  );
}
