import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

/**
 * Doc trang thai dang nhap tu store (khong goi API). Dung trong layout/page:
 *   const { user, logout } = useAuth();
 * Viec nap profile tu /auth/me nam o useAuthProfile (ProtectedRoute).
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const clearSession = useAuthStore((state) => state.logout);
  const logout = useCallback(() => {
    queryClient.clear();
    clearSession();
  }, [clearSession, queryClient]);

  return { isAuthenticated: Boolean(accessToken), user, permissions, logout };
};
