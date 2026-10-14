import { App } from 'antd';
import { createElement } from 'react';
import { UserLockImpact } from './UserLockImpact';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, ROUTES, USER_STATUS } from '@/constants';
import { getLockPreview } from '@/services/sprint3.service';
import { updateUserStatus } from '@/services/user.service';

/** BR-1.15: xem tác động trước khi khóa; coach có lớp mở phải đổi người dạy. */
export function useUserLock() {
  const { modal, message } = App.useApp();
  const client = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: ({ user, confirmed }) =>
      updateUserStatus(
        user.id,
        user.status === USER_STATUS.ACTIVE ? USER_STATUS.INACTIVE : USER_STATUS.ACTIVE,
        confirmed,
      ),
    onSuccess: () => {
      message.success('Đã cập nhật tài khoản');
      client.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      client.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULE });
    },
    onError: (error) => message.error(error.message),
  });
  return async (user) => {
    if (user.status !== USER_STATUS.ACTIVE) return mutation.mutateAsync({ user });
    try {
      const { data } = await getLockPreview(user.id);
      if (data.classes.length)
        return modal.info({
          title: 'Cần đổi HLV trước khi khóa',
          content: createElement(UserLockImpact, {
            impact: data,
            onManage: () => navigate(`${ROUTES.SCHEDULE}?tab=manage`),
          }),
        });
      modal.confirm({
        title: 'Khóa tài khoản và hủy đăng ký tương lai?',
        okText: 'Xác nhận khóa',
        cancelText: 'Hủy',
        content: createElement(UserLockImpact, { impact: data }),
        onOk: () => mutation.mutateAsync({ user, confirmed: true }),
      });
    } catch (error) {
      message.error(error.message);
    }
  };
}
