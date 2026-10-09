import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { QUERY_KEYS } from '@/constants';

/** Chạy thao tác ghi và tải lại danh sách bộ môn/phòng tập sau khi thành công. */
export const useScheduleMutation = (mutationFn, onSuccess) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE });
      message.success(result.message || 'Thao tác thành công');
      onSuccess?.(result);
    },
    onError: (error) => message.error(error.message),
  });
};
