import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI, SESSION_STATUS, ENROLLMENT_STATUS } from '@/constants/schedule';
import * as service from '@/services/schedule.service';
import { vietnamInput, vietnamWeekStart } from '@/utils/schedule';

/** Lịch tuần từ server; lọc ngày và lịch huỷ ở client sau khi đã áp dụng RBAC. */
export const useScheduleCalendar = (kind) => {
  const [date, setDate] = useState(() => vietnamInput(new Date()));
  const [mode, setMode] = useState('week');
  const [showCancelled, setShowCancelled] = useState(false);
  const week = vietnamWeekStart(date);
  const weekStart = week.format(SCHEDULE_UI.DATE_PATTERN);
  const query = useQuery({
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
  return {
    query,
    events,
    date,
    setDate,
    mode,
    setMode,
    showCancelled,
    setShowCancelled,
    days,
    move: (direction) =>
      setDate(date.add(direction * (mode === 'day' ? 1 : SCHEDULE_UI.DAYS_PER_WEEK), 'day')),
  };
};
