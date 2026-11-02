import { Navigate } from 'react-router';
import { ROUTES } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import { canAccessRoute } from './canAccessRoute';

/**
 * Chan route theo permission. Khong co quyen => trang 403.
 * @param {{ permission?: string|string[], excludePermission?: string, children: import('react').ReactNode }} props
 */
export function PermissionRoute({ permission, excludePermission, children }) {
  const { can } = usePermission();
  if (!canAccessRoute({ permission, excludePermission }, can))
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  return children;
}
