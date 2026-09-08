import { Navigate } from 'react-router';
import { ROUTES } from '@/constants';
import { usePermission } from '@/hooks/usePermission';

/**
 * Chan route theo permission. Khong co quyen => trang 403.
 * @param {{ permission?: string|string[], children: import('react').ReactNode }} props
 */
export function PermissionRoute({ permission, children }) {
  const { can } = usePermission();
  if (!can(permission)) return <Navigate to={ROUTES.FORBIDDEN} replace />;
  return children;
}
