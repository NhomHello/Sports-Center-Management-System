import { ERROR_CODES } from '@scms/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { QUERY_KEYS } from '@/constants';
import { resolvePostLoginPath } from '@/router/resolvePostLoginPath';
import { routeRegistry } from '@/router/routeRegistry';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * Đăng nhập, nạp quyền rồi chuyển tới màn hình được phép. Khi email chưa xác minh trả về
 * `unverifiedEmail` để form hiện hướng dẫn thay vì chỉ một thông báo thoáng qua.
 * @param {import('antd').FormInstance} form
 */
export function useLogin(form) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const setProfile = useAuthStore((state) => state.setProfile);
  const clearSession = useAuthStore((state) => state.logout);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async ({ data, message: msg }) => {
      queryClient.clear();
      setSession(data);
      try {
        const profileResponse = await authService.getMe();
        setProfile(profileResponse.data);
        queryClient.setQueryData(QUERY_KEYS.ME, profileResponse);
        const destination = resolvePostLoginPath({
          requestedLocation: location.state?.from,
          permissions: profileResponse.data.permissions,
          routes: routeRegistry,
        });
        message.success(msg);
        navigate(destination, { replace: true });
      } catch (error) {
        clearSession();
        message.error(error.message || 'Không thể tải quyền tài khoản');
      }
    },
    onError: (error) => {
      const unverified = error.code === ERROR_CODES.EMAIL_NOT_VERIFIED;
      setUnverifiedEmail(unverified ? error.details?.email : null);
      form.setFields(error.toFormFields());
      // Chưa xác minh: hướng dẫn chi tiết hiển thị ngay trên form thay vì thông báo thoáng qua.
      if (!unverified) message.error(error.message);
    },
  });

  return { loginMutation, unverifiedEmail };
}
