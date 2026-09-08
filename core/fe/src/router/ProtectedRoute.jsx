import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoading } from '@/components/common/PageLoading';
import { ROUTES } from '@/constants';
import { useAuthProfile } from '@/hooks/useAuthProfile';

/**
 * Chan route can dang nhap. Chua co token => ve login (nho trang dang vao de quay lai).
 * Co token => cho nap xong profile (user + permissions) roi moi render, de PermissionRoute
 * ben trong luon thay danh sach quyen day du.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthProfile();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (isLoading) return <PageLoading fullscreen />;
  return <Outlet />;
}
