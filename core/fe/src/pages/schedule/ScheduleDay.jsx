import { CalendarOutlined } from '@ant-design/icons';
import { WEEKDAYS } from '@/constants/schedule';
import { vietnamInput } from '@/utils/schedule';
import { ScheduleList } from './ScheduleList';

/** Ngày trống giữ bố cục gọn; ngày hiện tại được nhận diện theo giờ Việt Nam. */
export function ScheduleDay({ day, events, onDetail, renderActions }) {
  const isToday = day.isSame(vietnamInput(new Date()), 'day');
  return (
    <section className={`scms-schedule-day ${isToday ? 'scms-schedule-day--today' : ''}`}>
      <header className="scms-schedule-day__header">
        <div>
          <span>{WEEKDAYS.find((weekday) => weekday.value === day.day())?.label}</span>
          <strong>{day.format('DD/MM')}</strong>
        </div>
        {isToday ? (
          <span className="scms-schedule-day__today">Hôm nay</span>
        ) : (
          events.length > 0 && (
            <span className="scms-schedule-day__count">{events.length} buổi</span>
          )
        )}
      </header>
      {events.length ? (
        <ScheduleList events={events} onDetail={onDetail} renderActions={renderActions} />
      ) : (
        <div className="scms-schedule-day__empty">
          <CalendarOutlined />
          <span>Không có buổi học</span>
        </div>
      )}
    </section>
  );
}
