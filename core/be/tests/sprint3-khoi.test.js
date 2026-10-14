import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SETTING_KEYS as K } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './helpers/sprint2.js';
import { loginKey } from '../src/modules/auth/login-lock.service.js';
import { issueToken } from '../src/modules/auth/email-token.service.js';
let f;
let item;
const login = (email, password) => api.post(apiPath('/auth/login')).send({ email, password });
const get = (query, token = f.memberToken) =>
  api.get(apiPath('/attendance/me')).set(bearer(token)).query(query);
beforeAll(async () => {
  f = await createClassFixture();
  const res = await api.post(apiPath('/classes')).set(bearer(f.adminToken)).send(classPayload(f));
  expect(res.status).toBe(201);
  item = res.body.data;
  await prisma.attendance.createMany({
    data: [
      {
        sessionId: item.sessions[0].id,
        memberId: f.member.id,
        actorId: f.coach.id,
        status: 'PRESENT',
      },
      {
        sessionId: item.sessions[1].id,
        memberId: f.other.id,
        actorId: f.coach.id,
        status: 'ABSENT',
      },
    ],
  });
});
afterAll(async () => {
  if (!f) return;
  await prisma.attendance.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.emailVerificationToken.deleteMany({ where: { userId: { in: f.userIds } } });
  await prisma.loginThrottle.deleteMany({
    where: { key: { in: f.userIds.map((id) => loginKey({ id })) } },
  });
  await cleanupClassFixture(f);
});
describe('S3-50 lịch sử điểm danh', () => {
  it('chỉ trả chính chủ, có lớp, buổi và tên người ghi; lọc và phân trang', async () => {
    const res = await get({ classId: item.id, pageSize: 1 });
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      memberId: f.member.id,
      actor: { fullName: f.coach.fullName },
      session: { classId: item.id },
    });
    expect((await get({ status: 'ABSENT' })).body.meta.total).toBe(0);
    expect((await get({ classId: item.id }, f.otherToken)).body.data[0].memberId).toBe(f.other.id);
  });
  it('từ chối giả mạo memberId và ngày không hợp lệ', async () => {
    expect((await get({ memberId: f.other.id })).status).toBe(400);
    expect((await get({ from: '2026-12-01', to: '2026-01-01' })).status).toBe(400);
    expect((await api.get(apiPath('/attendance/me'))).status).toBe(401);
  });
});
describe('S3-69 khoá đăng nhập tạm thời', () => {
  it('đăng nhập đúng xoá bộ đếm, sai song song đủ ngưỡng khoá cả khi dùng đúng mật khẩu', async () => {
    const key = loginKey(f.member);
    await login(f.member.email, 'Wrong@123');
    expect((await prisma.loginThrottle.findUnique({ where: { key } })).attempts).toBe(1);
    expect((await login(f.member.email, f.password)).status).toBe(200);
    expect((await prisma.loginThrottle.findUnique({ where: { key } })).attempts).toBe(0);
    const limit = Number(
      (
        await prisma.systemSetting.findUniqueOrThrow({
          where: { key: K.LOGIN_MAX_FAILED_ATTEMPTS },
        })
      ).value,
    );
    await Promise.all(Array.from({ length: limit }, () => login(f.member.email, 'Wrong@123')));
    const res = await login(f.member.email, f.password);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('LOGIN_TEMPORARILY_LOCKED');
    expect(new Date(res.body.details.lockedUntil) > new Date()).toBe(true);
  });
  it('hết thời gian cho thử lại; reset mật khẩu thành công mở khoá', async () => {
    const key = loginKey(f.member);
    await prisma.loginThrottle.update({ where: { key }, data: { lockedUntil: new Date(0) } });
    expect((await login(f.member.email, f.password)).status).toBe(200);
    await prisma.loginThrottle.update({
      where: { key },
      data: { attempts: 100, lockedUntil: new Date(Date.now() + 60000) },
    });
    const { token } = await issueToken({
      userId: f.member.id,
      email: f.member.email,
      purpose: 'RESET_PASSWORD',
      ttlSettingKey: K.PASSWORD_RESET_TTL_MINUTES,
    });
    expect(
      (
        await api
          .post(apiPath('/auth/password-resets/confirm'))
          .send({ token, password: f.password })
      ).status,
    ).toBe(200);
    expect((await login(f.member.email, f.password)).status).toBe(200);
  });
});
