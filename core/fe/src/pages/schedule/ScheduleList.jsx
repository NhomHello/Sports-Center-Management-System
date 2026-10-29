import { ScheduleEventCard } from './ScheduleEventCard';
/** Danh sách buổi của một ngày, room/coach lấy snapshot của buổi. */
export function ScheduleList({ events, onDetail, renderActions, kind }) {
  return (
    <div className="scms-calendar-events">
      {events.map((event) => (
        <ScheduleEventCard
          key={event.id}
          kind={kind}
          event={event}
          onDetail={onDetail}
          renderActions={renderActions}
        />
      ))}
    </div>
  );
}
