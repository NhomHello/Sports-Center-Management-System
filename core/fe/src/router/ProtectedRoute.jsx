import { Navigate, Outlet, useLocation } from 'react-router';
import { PageLoading } from '@/components/common/PageLoading';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

/** Chan route can dang nhap. Chua co token => ve login (nho trang dang vao de quay lai). */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  if (isLoading) return <PageLoading fullscreen />;
  return <Outlet />;
}
