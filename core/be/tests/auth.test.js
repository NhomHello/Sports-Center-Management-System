import { ERROR_CODES } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';
import { describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { api, apiPath, bearer, loginAsAdmin } from './helpers/api.js';

describe('Auth - POST /auth/login', () => {
  it('TC-AUTH-01: dang nhap dung => 200, co accessToken, khong lo passwordHash', async () => {
    const res = await api
      .post(apiPath('/auth/login'))
      .send({ email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD });

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTypeOf('string');
    expect(res.body.data.user.email).toBe(env.SEED_ADMIN_EMAIL);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('TC-AUTH-02: sai mat khau => 401 INVALID_CREDENTIALS', async () => {
    const res = await api
      .post(apiPath('/auth/login'))
      .send({ email: env.SEED_ADMIN_EMAIL, password: 'sai-mat-khau-123' });

    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('TC-AUTH-03: thieu email => 400 VALIDATION_ERROR kem details', async () => {
    const res = await api.post(apiPath('/auth/login')).send({ password: 'x' });

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.details.some((d) => d.field === 'email')).toBe(true);
  });
});

describe('Auth - GET /auth/me', () => {
  it('TC-AUTH-04: khong token => 401', async () => {
    const res = await api.get(apiPath('/auth/me'));
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('TC-AUTH-05: token khong hop le => 401', async () => {
    const res = await api.get(apiPath('/auth/me')).set(bearer('token-bay-ba'));
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('TC-AUTH-06: co token => tra user + danh sach permissions', async () => {
    const token = await loginAsAdmin();
    const res = await api.get(apiPath('/auth/me')).set(bearer(token));

    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.data.user.role.name).toBeTypeOf('string');
    expect(Array.isArray(res.body.data.permissions)).toBe(true);
    expect(res.body.data.permissions.length).toBeGreaterThan(0);
  });
});

describe('Auth - POST /auth/register', () => {
  it('TC-AUTH-07: email da ton tai => 409 CONFLICT', async () => {
    const res = await api.post(apiPath('/auth/register')).send({
      email: env.SEED_ADMIN_EMAIL,
      password: 'Password@123',
      fullName: 'Trung Email',
    });

    expect(res.status).toBe(StatusCodes.CONFLICT);
    expect(res.body.code).toBe(ERROR_CODES.CONFLICT);
  });

  it('TC-AUTH-08: mat khau ngan => 400', async () => {
    const res = await api.post(apiPath('/auth/register')).send({
      email: 'ai-do@scms.local',
      password: '123',
      fullName: 'Ai Do',
    });
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
  });
});
