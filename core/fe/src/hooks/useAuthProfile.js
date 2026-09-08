import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/constants';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * Nap profile (user + permissions) tu /auth/me khi da co token va ghi vao store.
 * CHI dung o ProtectedRoute. Component khac doc store qua useAuth() / usePermission().
 *
 * Quan trong: isLoading dua vao isProfileLoaded (store) chu khong dua vao query.isPending,
 * vi setProfile chay trong useEffect SAU khi query xong -> co 1 frame permissions con rong,
 * PermissionRoute se tuong khong co quyen va day sang 403.
 */
export const useAuthProfile = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isProfileLoaded = useAuthStore((state) => state.isProfileLoaded);
  const setProfile = useAuthStore((state) => state.setProfile);
  const logout = useAuthStore((state) => state.logout);

  const query = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: authService.getMe,
    enabled: Boolean(accessToken) && !isProfileLoaded,
  });

  useEffect(() => {
    if (query.data?.data) setProfile(query.data.data);
  }, [query.data, setProfile]);

  // Khong lay duoc profile (token hong, server loi) => dang xuat de ve trang login
  useEffect(() => {
    if (query.isError) logout();
  }, [query.isError, logout]);

  return {
    isAuthenticated: Boolean(accessToken),
    isLoading: Boolean(accessToken) && !isProfileLoaded && !query.isError,
  };
};
