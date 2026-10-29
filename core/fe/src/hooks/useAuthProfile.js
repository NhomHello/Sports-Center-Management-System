import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { HTTP_STATUS, QUERY_KEYS } from '@/constants';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

const TOKEN_REJECTED = [HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN];

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

  // Chi dang xuat khi token bi tu choi (401/403). Loi tam thoi (429, 5xx, mat mang) giu phien
  // va cho thu lai, tranh day hoi vien ve trang login chi vi may chu dang ban.
  const rejected = query.isError && TOKEN_REJECTED.includes(query.error?.status);
  useEffect(() => {
    if (rejected) logout();
  }, [rejected, logout]);

  return {
    isAuthenticated: Boolean(accessToken),
    isLoading: Boolean(accessToken) && !isProfileLoaded && !query.isError,
    error: query.isError && !rejected ? query.error : null,
    retry: query.refetch,
  };
};
