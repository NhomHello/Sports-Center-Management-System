import { usePermission } from '@/hooks/usePermission';

/**
 * Chi render children khi user co quyen.
 *   <PermissionGate permission={PERMISSIONS.ROLE_CREATE}><Button>Thêm</Button></PermissionGate>
 * @param {{ permission: string|string[], fallback?: import('react').ReactNode, children: import('react').ReactNode }} props
 */
export function PermissionGate({ permission, fallback = null, children }) {
  const { can } = usePermission();
  return can(permission) ? children : fallback;
}
