import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/constants';
import { resolvePostLoginPath } from './resolvePostLoginPath';

const routes = [
  { path: ROUTES.DASHBOARD, permission: 'dashboard.view' },
  { path: ROUTES.PROFILE },
  { path: ROUTES.SYSTEM_ROLES, permission: 'role.read' },
];

describe('resolvePostLoginPath', () => {
  it('giữ route cũ khi role mới vẫn có quyền', () => {
    expect(
      resolvePostLoginPath({
        requestedLocation: { pathname: ROUTES.SYSTEM_ROLES, search: '?tab=matrix' },
        permissions: ['role.read'],
        routes,
      }),
    ).toBe(`${ROUTES.SYSTEM_ROLES}?tab=matrix`);
  });

  it('chuyển tới route đầu tiên được phép thay vì rơi vào 403', () => {
    expect(
      resolvePostLoginPath({
        requestedLocation: { pathname: ROUTES.SYSTEM_ROLES },
        permissions: ['dashboard.view'],
        routes,
      }),
    ).toBe(ROUTES.DASHBOARD);
  });
});
