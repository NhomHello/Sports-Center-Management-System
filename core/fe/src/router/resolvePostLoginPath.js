import { ROUTES } from '@/constants';
import { hasAnyPermission } from '@/utils/permission';
import { canAccessRoute } from './canAccessRoute';

/** Tránh đưa tài khoản vừa đăng nhập trở lại một route mà role mới không có quyền. */
export const resolvePostLoginPath = ({ requestedLocation, permissions, routes }) => {
  const can = (required) => hasAnyPermission(permissions, required);
  const requestedPath = requestedLocation?.pathname;
  const requestedRoute = routes.find((route) => route.path === requestedPath);
  if (requestedPath !== ROUTES.FORBIDDEN && requestedRoute && canAccessRoute(requestedRoute, can)) {
    return `${requestedPath}${requestedLocation.search ?? ''}`;
  }

  const dashboard = routes.find((route) => route.path === ROUTES.DASHBOARD);
  if (dashboard && canAccessRoute(dashboard, can)) return ROUTES.DASHBOARD;
  return routes.find((route) => canAccessRoute(route, can))?.path ?? ROUTES.PROFILE;
};
