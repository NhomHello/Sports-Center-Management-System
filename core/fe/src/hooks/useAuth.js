import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { QUERY_KEYS } from '@/constants';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * Tai profile (user + permissions) khi da co token. Dung o ProtectedRoute.
 * Tra ve trang thai de hien loading / redirect.
 */
export const useAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isProfileLoaded = useAuthStore((state) => state.isProfileLoaded);
  const setProfile = useAuthStore((state) => state.setProfile);
  const logout = useAuthStore((state) => state.logout);

  const query = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: authService.getMe,
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (query.data?.data) setProfile(query.data.data);
  }, [query.data, setProfile]);

  return {
    isAuthenticated: Boolean(accessToken),
    isLoading: Boolean(accessToken) && !isProfileLoaded && query.isPending,
    user,
    logout,
  };
};
