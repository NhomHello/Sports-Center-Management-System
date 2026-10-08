import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { QUERY_KEYS, TABLE } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { useLiveScheduleQuery } from '@/hooks/useLiveScheduleQuery';
import * as notificationService from '@/services/notification.service';
import { shouldRetryApiQuery } from '@/utils/apiAvailability';

const DEFAULT_PARAMS = Object.freeze({
  page: TABLE.DEFAULT_PAGE,
  pageSize: TABLE.DEFAULT_PAGE_SIZE,
});

/** Chuông và trang dùng chung query; tự cập nhật cả thông báo lớp đổi/huỷ từ tài khoản khác. */
export const useNotifications = (params = DEFAULT_PARAMS) => {
  const { user } = useAuth();
  return useLiveScheduleQuery({
    queryKey: [...QUERY_KEYS.NOTIFICATIONS, user?.id, params],
    queryFn: () => notificationService.listNotifications(params),
    retry: shouldRetryApiQuery,
  });
};

/** Giữ các mục đọc thất bại để retry; chỉ invalidate sau kết quả từ server. */
export const useNotificationReadActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [failedResults, setFailedResults] = useState([]);
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.NOTIFICATIONS, user?.id] });
  const mutation = useMutation({
    mutationFn: notificationService.markNotificationRead,
    onSuccess: ({ data }) => {
      setFailedResults((results) => results.filter((item) => item.id !== data.id));
      return invalidate();
    },
  });
  const bulkMutation = useMutation({
    mutationFn: async (ids) => {
      const uniqueIds = [...new Set(ids)];
      const results = await Promise.allSettled(
        uniqueIds.map(notificationService.markNotificationRead),
      );
      return results.map((result, index) => ({
        id: uniqueIds[index],
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
    onSuccess: (results) => {
      const attemptedIds = results.map((item) => item.id);
      setFailedResults((previous) => [
        ...previous.filter((item) => !attemptedIds.includes(item.id)),
        ...results.filter((item) => item.error),
      ]);
      return invalidate();
    },
  });
  return { mutation, bulkMutation, failedResults };
};
