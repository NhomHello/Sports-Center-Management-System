/**
 * Helper cho test tich hop: goi API qua supertest, dang nhap lay token.
 * Yeu cau DB dev dang chay va da seed (npm run dev hoac npm run setup).
 */
import request from 'supertest';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';

export const api = request(app);

/** @param {string} path vi du '/auth/login' */
export const apiPath = (path) => `${env.API_PREFIX}${path}`;

/** @param {string} token */
export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} accessToken
 */
export const loginAs = async (email, password) => {
  const res = await api.post(apiPath('/auth/login')).send({ email, password });
  if (!res.body?.data?.accessToken) {
    throw new Error(`Dang nhap that bai cho ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.accessToken;
};

/** Dang nhap bang tai khoan admin seed (SEED_ADMIN_* trong .env) */
export const loginAsAdmin = () => loginAs(env.SEED_ADMIN_EMAIL, env.SEED_ADMIN_PASSWORD);

/** Tien to cho du lieu tao trong test de de nhan dien & don dep */
export const TEST_PREFIX = 'TEST_';
