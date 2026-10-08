import { useState } from 'react';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI, SESSION_STATUS, ENROLLMENT_STATUS } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
import { vietnamInput, vietnamWeekStart, vietnamCalendarDate } from '@/utils/schedule';

/** Lịch tuần từ server; lọc ngày và lịch huỷ ở client sau khi đã áp dụng RBAC. */
export const useScheduleCalendar = (kind) => {
  const [date, updateDate] = useState(() => vietnamCalendarDate(vietnamInput(new Date())));
  const setDate = (value) => updateDate(vietnamCalendarDate(value));
  const [mode, setMode] = useState('week');
  const [showCancelled, setShowCancelled] = useState(false);
  const week = vietnamWeekStart(date);
  const weekStart = week.format(SCHEDULE_UI.DATE_PATTERN);
  const query = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'week', kind, weekStart],
    queryFn: () => service.getSchedule(kind, { weekStart }),
  });
  const events = (query.data?.data || []).filter(
    (event) =>
      showCancelled ||
      (event.status !== SESSION_STATUS.CANCELLED &&
        event.enrollmentStatus !== ENROLLMENT_STATUS.CANCELLED),
  );
  const days =
    mode === 'day'
      ? [date]
      : Array.from({ length: SCHEDULE_UI.DAYS_PER_WEEK }, (_, index) => week.add(index, 'day'));
  const visibleEvents =
    mode === 'day'
      ? events.filter((event) => vietnamInput(event.startAt).isSame(date, 'day'))
      : events;
  return {
    query,
    events: visibleEvents,
    date,
    setDate,
    mode,
    setMode,
    showCancelled,
    setShowCancelled,
    days,
    move: (direction) =>
      updateDate((current) =>
        vietnamCalendarDate(
          current.add(direction * (mode === 'day' ? 1 : SCHEDULE_UI.DAYS_PER_WEEK), 'day'),
        ),
      ),
  };
};
