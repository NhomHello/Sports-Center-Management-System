import { useQuery } from '@tanstack/react-query';
import { SCHEDULE_UI } from '@/constants/schedule';

/** Lịch có thể đổi từ tài khoản khác; cập nhật khi đang xem hoặc quay lại cửa sổ. */
export const useLiveScheduleQuery = (options) =>
  useQuery({
    refetchInterval: SCHEDULE_UI.REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    ...options,
  });
