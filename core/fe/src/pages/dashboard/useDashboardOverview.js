import { QUERY_KEYS } from '@/constants';
import { SCHEDULE_UI } from '@/constants/schedule';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import { useNotifications } from '@/hooks/useNotifications';
import * as scheduleService from '@/services/schedule.service';
import { shouldRetryApiQuery } from '@/utils/apiAvailability';
import { vietnamInput, vietnamWeekStart } from '@/utils/schedule';
import { getUpcomingSessions, resolveDashboardSchedule } from './dashboardData';

/** Tái sử dụng cache lịch/chuông, dữ liệu cùng phạm vi và nhịp cập nhật với các trang chi tiết. */
export const useDashboardOverview = (can) => {
  const today = vietnamInput(new Date());
  const weekStart = vietnamWeekStart(today).format(SCHEDULE_UI.DATE_PATTERN);
  const kind = resolveDashboardSchedule(can);
  const schedule = useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'week', kind, weekStart],
    queryFn: () => scheduleService.getSchedule(kind, { weekStart }),
    enabled: Boolean(kind),
    retry: shouldRetryApiQuery,
  });
  const notifications = useNotifications();
  const upcoming = getUpcomingSessions(schedule.data?.data, today.toDate(), kind);
  return { today, kind, schedule, notifications, upcoming };
};
