import { useState } from 'react';
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
  const [detailId, setDetailId] = useState(null);
  const actions = (item) => <ClassBookingActions item={item} />;
  return (
    <div className="scms-schedule-calendar-view">
      <ScheduleToolbar calendar={calendar} />
      <QueryState query={calendar.query}>
        <div className="scms-calendar-heading">
          <div>
            <h3>
              {calendar.mode === 'day'
                ? `Ngày ${calendar.date.format('DD/MM/YYYY')}`
                : `Tuần ${calendar.days[0].format('DD/MM')} – ${calendar.days.at(-1).format('DD/MM/YYYY')}`}
            </h3>
            <p>Giờ Việt Nam · Đăng ký và huỷ áp dụng cho toàn lớp</p>
          </div>
          <span className="scms-calendar-total">{calendar.events.length} buổi học</span>
        </div>
        <div
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
                  day={day}
                  events={calendar.events.filter(
                    (e) => vietnamInput(e.startAt).format(SCHEDULE_UI.DATE_PATTERN) === date,
                  )}
                  onDetail={setDetailId}
                  renderActions={actions}
                />
              );
            })}
          </div>
        </div>
      </QueryState>
      {detailId && (
        <ClassDetailDrawer
          id={detailId}
          onClose={() => setDetailId(null)}
          renderActions={actions}
        />
      )}
    </div>
  );
}
