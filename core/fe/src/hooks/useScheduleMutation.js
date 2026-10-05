import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { QUERY_KEYS } from '@/constants';

/** Sau ghi cập nhật mọi projection lịch/lớp/roster và thông báo liên quan. */
export const useScheduleMutation = (mutationFn, afterSuccess) => {
  const { message } = App.useApp();
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      client.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE });
      client.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
      message.success(result.message || 'Thao tác thành công');
      afterSuccess?.(result);
    },
    onError: (error) => message.error(error.message),
  });
};
