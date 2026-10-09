import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { QUERY_KEYS } from '@/constants';

/** Chạy thao tác ghi và tải lại dữ liệu lịch/lớp sau khi thành công. */
export const useScheduleMutation = (mutationFn, onSuccess, onError) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE });
      message.success(result.message || 'Thao tác thành công');
      onSuccess?.(result);
    },
    onError: (error) => {
      onError?.(error);
      message.error(error.message);
    },
  });
};
