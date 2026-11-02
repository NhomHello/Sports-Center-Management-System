/** Dùng cùng điều kiện cho menu, lối tắt, đăng nhập và truy cập trực tiếp. */
export const canAccessRoute = (route, can) =>
  can(route.permission) && !(route.excludePermission && can(route.excludePermission));
