import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { QUERY_KEYS } from '@/constants';
import * as userService from '@/services/user.service';

/**
 * Xác minh email thủ công cho hội viên (nhân viên có quyền user.verify_email).
 * @param {{ member: { id: number }, onUpdated?: (member: object) => void }} options
 */
export function useVerifyMemberEmail({ member, onUpdated }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userService.verifyUserEmail(member.id),
    onSuccess: ({ data }) => {
      message.success('Đã xác minh email cho hội viên');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
      onUpdated?.({ ...member, emailVerifiedAt: data.emailVerifiedAt });
    },
    onError: (error) => message.error(error.message || 'Có lỗi xảy ra'),
  });
}
