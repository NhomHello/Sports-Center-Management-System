import { describe, expect, it } from 'vitest';
import { buildMenuItems } from './buildMenuItems';
import { hasAnyPermission } from '@/utils/permission';
import { ROUTES } from '@/constants';

const routes = [
  { path: '/', permission: 'dashboard.view', menu: { label: 'Tổng quan' } },
  { path: '/system/roles', permission: 'role.read', menu: { label: 'Vai trò', group: 'Hệ thống' } },
  {
    path: '/system/users',
    permission: 'user.read',
    menu: { label: 'Tài khoản', group: 'Hệ thống' },
  },
  { path: '/hidden', permission: 'x.y' },
];

describe('buildMenuItems', () => {
  it('hiện các màn cá nhân cho tài khoản không có quyền quản trị theo contract của hook', () => {
    const can = (...codes) => hasAnyPermission([], codes.flat());
    const personalRoutes = [
      { path: ROUTES.PROFILE, menu: { label: 'Hồ sơ cá nhân' } },
      { path: ROUTES.CHANGE_PASSWORD, menu: { label: 'Đổi mật khẩu' } },
      { path: ROUTES.NOTIFICATIONS, menu: { label: 'Thông báo' } },
      { path: ROUTES.SYSTEM_SETTINGS, permission: 'setting.read', menu: { label: 'Cấu hình' } },
    ];
    expect(buildMenuItems(personalRoutes, can).map((item) => item.key)).toEqual([
      ROUTES.PROFILE,
      ROUTES.CHANGE_PASSWORD,
      ROUTES.NOTIFICATIONS,
    ]);
  });
  it('chi hien route co quyen, gom nhom theo group', () => {
    const can = (p) => ['dashboard.view', 'role.read'].includes(p);
    const items = buildMenuItems(routes, can);
    expect(items).toHaveLength(2);
    expect(items[0].key).toBe('/');
    expect(items[1].children.map((c) => c.key)).toEqual(['/system/roles']);
  });

  it('khong hien group rong', () => {
    const can = (p) => p === 'dashboard.view';
    expect(buildMenuItems(routes, can)).toHaveLength(1);
  });

  it('bo qua route khong co menu', () => {
    const items = buildMenuItems(routes, () => true);
    expect(items.some((i) => i.key === '/hidden')).toBe(false);
  });
});
