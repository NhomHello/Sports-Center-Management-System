/**
 * Kiem chung RBAC dynamic: doi quyen cua role tren API la co hieu luc ngay voi user dang dang nhap.
 */
import { ERROR_CODES, PERMISSIONS } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashPassword } from '../src/common/utils/password.js';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer, loginAs, loginAsAdmin, TEST_PREFIX } from './helpers/api.js';

const ROLE_CODE = `${TEST_PREFIX}RBAC_${Date.now()}`;
const USER_EMAIL = `${ROLE_CODE.toLowerCase()}@scms.local`;
const USER_PASSWORD = 'Password@123';

let adminToken;
let role;
let userToken;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
  role = await prisma.role.create({ data: { code: ROLE_CODE, name: 'Role test RBAC' } });
  await prisma.user.create({
    data: {
      email: USER_EMAIL,
      fullName: 'User test RBAC',
      passwordHash: await hashPassword(USER_PASSWORD),
      roleId: role.id,
    },
  });
  userToken = await loginAs(USER_EMAIL, USER_PASSWORD);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: USER_EMAIL } });
  await prisma.role.deleteMany({ where: { code: ROLE_CODE } });
  await prisma.$disconnect();
});

describe('RBAC dynamic', () => {
  it('TC-RBAC-01: role khong co quyen => GET /roles tra 403 FORBIDDEN', async () => {
    const res = await api.get(apiPath('/roles')).set(bearer(userToken));
    expect(res.status).toBe(StatusCodes.FORBIDDEN);
    expect(res.body.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it('TC-RBAC-02: admin cap quyen role.read => user do vao duoc NGAY, khong can login lai', async () => {
    const grant = await api
      .put(apiPath(`/roles/${role.id}`))
      .set(bearer(adminToken))
      .send({ permissionCodes: [PERMISSIONS.ROLE_READ] });
    expect(grant.status).toBe(StatusCodes.OK);

    const res = await api.get(apiPath('/roles')).set(bearer(userToken));
    expect(res.status).toBe(StatusCodes.OK);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('TC-RBAC-03: co role.read nhung khong co role.create => POST /roles van 403', async () => {
    const res = await api
      .post(apiPath('/roles'))
      .set(bearer(userToken))
      .send({ code: `${TEST_PREFIX}X`, name: 'x', permissionCodes: [] });
    expect(res.status).toBe(StatusCodes.FORBIDDEN);
  });

  it('TC-RBAC-04: thu hoi quyen => 403 tro lai', async () => {
    await api
      .put(apiPath(`/roles/${role.id}`))
      .set(bearer(adminToken))
      .send({ permissionCodes: [] });
    const res = await api.get(apiPath('/roles')).set(bearer(userToken));
    expect(res.status).toBe(StatusCodes.FORBIDDEN);
  });

  it('TC-RBAC-05: /auth/me tra dung danh sach permission hien tai', async () => {
    await api
      .put(apiPath(`/roles/${role.id}`))
      .set(bearer(adminToken))
      .send({ permissionCodes: [PERMISSIONS.DASHBOARD_VIEW] });
    const res = await api.get(apiPath('/auth/me')).set(bearer(userToken));
    expect(res.body.data.permissions).toEqual([PERMISSIONS.DASHBOARD_VIEW]);
  });
});
