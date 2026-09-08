import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { hasAllPermissions, hasAnyPermission } from '@/utils/permission';

/**
 * Hook kiem tra quyen trong component.
 *   const { can } = usePermission();
 *   {can(PERMISSIONS.ROLE_CREATE) && <Button>Thêm</Button>}
 * KHONG BAO GIO viet: user.role.code === 'CENTER_MANAGER'
 */
export const usePermission = () => {
  const permissions = useAuthStore((state) => state.permissions);
  const granted = useMemo(() => new Set(permissions), [permissions]);

  const can = useCallback((...codes) => hasAnyPermission(granted, codes.flat()), [granted]);
  const canAll = useCallback((...codes) => hasAllPermissions(granted, codes.flat()), [granted]);

  return { can, canAll, permissions };
};
