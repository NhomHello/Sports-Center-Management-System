import { ROUTES } from '@/constants';
import { hasAnyPermission } from '@/utils/permission';

/** Tránh đưa tài khoản vừa đăng nhập trở lại một route mà role mới không có quyền. */
export const resolvePostLoginPath = ({ requestedLocation, permissions, routes }) => {
  const requestedPath = requestedLocation?.pathname;
  const requestedRoute = routes.find((route) => route.path === requestedPath);
  if (
    requestedPath !== ROUTES.FORBIDDEN &&
    requestedRoute &&
    hasAnyPermission(permissions, requestedRoute.permission)
  ) {
    return `${requestedPath}${requestedLocation.search ?? ''}`;
  }

  return (
    routes.find((route) => hasAnyPermission(permissions, route.permission))?.path ?? ROUTES.PROFILE
  );
};
