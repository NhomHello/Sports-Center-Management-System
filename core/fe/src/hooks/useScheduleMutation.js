import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { QUERY_KEYS } from '@/constants';

/** Kể cả ghi bị từ chối, trạng thái chỗ/hạn huỷ có thể đã đổi từ tài khoản khác. */
export const useScheduleMutation = (mutationFn, afterSuccess) => {
  const { message } = App.useApp();
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      message.success(result.message || 'Thao tác thành công');
      afterSuccess?.(result);
    },
    onError: (error) => message.error(error.message),
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE }),
        client.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
      ]),
  });
};
