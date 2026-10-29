import { useState } from 'react';
import { Button, Empty, Grid } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { ManagementScheduleFilters } from './ManagementScheduleFilters';
import { SCHEDULE_UI } from '@/constants/schedule';
import { vietnamInput } from '@/utils/schedule';
import { useScheduleCalendar } from './useScheduleCalendar';
import { ClassBookingActions } from './ClassBookingActions';
import { ClassDetailDrawer } from './ClassDetailDrawer';
import { QueryState } from './QueryState';
import { ScheduleDay } from './ScheduleDay';
import { ScheduleToolbar } from './ScheduleToolbar';

/** Lịch ngày/tuần riêng biệt cho hội viên, HLV và quản lý. */
export function ScheduleCalendar({ kind }) {
  const calendar = useScheduleCalendar(kind);
  const [selectedSession, setSelectedSession] = useState(null);
  const screens = Grid.useBreakpoint();
  const compact = calendar.mode === 'week' && screens.lg;
  const actions = (item) => <ClassBookingActions item={item} />;
  return (
    <div className={`scms-schedule-calendar-view ${compact ? 'scms-calendar--compact' : ''}`}>
      <ScheduleToolbar calendar={calendar} kind={kind} />
      {kind === 'management' && <ManagementScheduleFilters calendar={calendar} />}
      {calendar.query.isSuccess && !calendar.events.length && (
        <Empty description="Chưa có buổi học trong khoảng thời gian này">
          {kind === 'own' && (
            <Link to={`${ROUTES.SCHEDULE}?tab=open`}>
              <Button type="primary">Xem lớp đang mở</Button>
            </Link>
          )}
        </Empty>
      )}
      <QueryState query={calendar.query}>
        <div
          hidden={!calendar.events.length}
          className="scms-calendar-scroll"
          role="region"
          aria-label="Lịch các buổi học"
          tabIndex={0}
        >
          <div className={calendar.mode === 'week' ? 'scms-week-grid' : 'scms-day-grid'}>
            {calendar.days.map((day) => {
              const date = day.format(SCHEDULE_UI.DATE_PATTERN);
              return (
                <ScheduleDay
                  key={date}
                  kind={kind}
                  day={day}
                  events={calendar.events.filter(
                    (e) => vietnamInput(e.startAt).format(SCHEDULE_UI.DATE_PATTERN) === date,
                  )}
                  onDetail={setSelectedSession}
                  renderActions={compact ? undefined : actions}
                />
              );
            })}
          </div>
        </div>
      </QueryState>
      {selectedSession && (
        <ClassDetailDrawer
          id={selectedSession.classId}
          selectedSession={selectedSession}
          onClose={() => setSelectedSession(null)}
          renderActions={actions}
        />
      )}
    </div>
  );
}
