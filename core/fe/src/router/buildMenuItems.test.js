import { describe, expect, it } from 'vitest';
import { buildMenuItems } from './buildMenuItems';
import { hasAnyPermission } from '@/utils/permission';
import { ROUTES } from '@/constants';
import { PERMISSIONS as P } from '@scms/shared';

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
  it('ẩn học viên cá nhân với quyền quản lý toàn trung tâm, vẫn hiện cho HLV', () => {
    const assignedRoute = {
      path: ROUTES.COACH_MEMBERS,
      permission: P.MEMBER_PROFILE_VIEW_ASSIGNED,
      excludePermission: P.CLASS_READ_ALL,
      menu: { label: 'Học viên của tôi', group: 'Lịch tập' },
    };
    const canWith =
      (...granted) =>
      (required) =>
        hasAnyPermission(granted, required);
    expect(
      buildMenuItems([assignedRoute], canWith(P.MEMBER_PROFILE_VIEW_ASSIGNED, P.CLASS_READ_ALL)),
    ).toEqual([]);
    expect(
      buildMenuItems([assignedRoute], canWith(P.MEMBER_PROFILE_VIEW_ASSIGNED))[0].children[0].key,
    ).toBe(ROUTES.COACH_MEMBERS);
  });
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
