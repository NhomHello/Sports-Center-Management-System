import { ERROR_CODES, PERMISSIONS } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer, loginAsAdmin, TEST_PREFIX } from './helpers/api.js';

const ROLE_CODE = `${TEST_PREFIX}ROLE_${Date.now()}`;
let adminToken;
let createdId;

beforeAll(async () => {
  adminToken = await loginAsAdmin();
});

afterAll(async () => {
  await prisma.role.deleteMany({ where: { code: { startsWith: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Role CRUD', () => {
  it('TC-ROLE-01: tao role hop le => 201, tra permissionCodes', async () => {
    const res = await api
      .post(apiPath('/roles'))
      .set(bearer(adminToken))
      .send({ code: ROLE_CODE, name: 'Role test', permissionCodes: [PERMISSIONS.DASHBOARD_VIEW] });

    expect(res.status).toBe(StatusCodes.CREATED);
    expect(res.body.data.permissionCodes).toEqual([PERMISSIONS.DASHBOARD_VIEW]);
    createdId = res.body.data.id;
  });

  it('TC-ROLE-02: trung code => 409', async () => {
    const res = await api
      .post(apiPath('/roles'))
      .set(bearer(adminToken))
      .send({ code: ROLE_CODE, name: 'Trung', permissionCodes: [] });
    expect(res.status).toBe(StatusCodes.CONFLICT);
  });

  it('TC-ROLE-03: code sai dinh dang (chu thuong) => 400', async () => {
    const res = await api
      .post(apiPath('/roles'))
      .set(bearer(adminToken))
      .send({ code: 'sai_dinh_dang', name: 'x', permissionCodes: [] });
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('TC-ROLE-04: permission khong ton tai => 400 kem danh sach missing', async () => {
    const res = await api
      .put(apiPath(`/roles/${createdId}`))
      .set(bearer(adminToken))
      .send({ permissionCodes: ['khong.ton.tai'] });
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.details.missing).toEqual(['khong.ton.tai']);
  });

  it('TC-ROLE-05: xoa role he thong => 422 BUSINESS_RULE_VIOLATION', async () => {
    const systemRole = await prisma.role.findFirst({ where: { isSystem: true } });
    const res = await api.delete(apiPath(`/roles/${systemRole.id}`)).set(bearer(adminToken));
    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
    expect(res.body.code).toBe(ERROR_CODES.BUSINESS_RULE_VIOLATION);
  });

  it('TC-ROLE-06: xoa role test => 204, GET lai => 404', async () => {
    const del = await api.delete(apiPath(`/roles/${createdId}`)).set(bearer(adminToken));
    expect(del.status).toBe(StatusCodes.NO_CONTENT);

    const get = await api.get(apiPath(`/roles/${createdId}`)).set(bearer(adminToken));
    expect(get.status).toBe(StatusCodes.NOT_FOUND);
  });
});
