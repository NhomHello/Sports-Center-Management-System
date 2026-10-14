import { expect, vi } from 'vitest';
import { prisma } from '../../src/config/db.js';
import { StatusCodes } from 'http-status-codes';
import { api, apiPath } from './api.js';

export const PASSWORD = 'Flows@12345';
export const stamp = Date.now();
/** Email duy nhất trong một lần chạy test, theo nhãn của từng tình huống. */
export const uniqueEmail = (label) => `test_flow_${label}_${stamp}@scms.test`;

/**
 * Bộ tiện ích cho test luồng email. `mail` là mock của mailer (vi.mock phải đặt ở file test).
 * @param {{ sendMail: import('vitest').Mock }} mail
 */
export const createEmailKit = (mail) => {
  const createdIds = [];

  /** Mail gửi nền: đợi mail đúng địa chỉ rồi lấy token từ link (không lấy nhầm mail của test khác). */
  const tokenFor = async (email) => {
    let call;
    await vi.waitFor(() => {
      call = mail.sendMail.mock.calls.map(([message]) => message).findLast((m) => m.to === email);
      expect(call).toBeDefined();
    });
    return call.text.match(/token=([a-f0-9]{64})/)[1];
  };
  const register = async (label) => {
    const email = uniqueEmail(label);
    const res = await api
      .post(apiPath('/auth/register'))
      .send({ email, password: PASSWORD, fullName: 'Người Dùng Email' });
    expect(res.status).toBe(StatusCodes.CREATED);
    createdIds.push(res.body.data.id);
    return { id: res.body.data.id, email };
  };
  const login = (identity, password = PASSWORD) =>
    api.post(apiPath('/auth/login')).send({ email: identity, password });
  const verify = (token) => api.post(apiPath('/auth/email-verifications/confirm')).send({ token });
  /** Đăng ký rồi xác minh để có tài khoản đăng nhập được. */
  const registerVerified = async (label) => {
    const user = await register(label);
    await verify(await tokenFor(user.email));
    mail.sendMail.mockClear();
    return user;
  };
  const cleanup = async () => {
    await prisma.auditLog.deleteMany({ where: { userId: { in: createdIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
  };
  return { createdIds, tokenFor, register, login, verify, registerVerified, cleanup };
};
