import { useAuthStore } from '@/stores/authStore';

/**
 * Doc trang thai dang nhap tu store (khong goi API). Dung trong layout/page:
 *   const { user, logout } = useAuth();
 * Viec nap profile tu /auth/me nam o useAuthProfile (ProtectedRoute).
 */
export const useAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);
  const logout = useAuthStore((state) => state.logout);

  return { isAuthenticated: Boolean(accessToken), user, permissions, logout };
};
