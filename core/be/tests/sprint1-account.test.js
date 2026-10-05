import { ERROR_CODES } from '@scms/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer, loginAs } from './helpers/api.js';
import { cleanupSprintFixture, createSprintFixture } from './helpers/sprint1.js';

let fixture;
beforeAll(async () => {
  fixture = await createSprintFixture();
});
afterAll(async () => {
  await cleanupSprintFixture(fixture);
});

describe('Sprint 1: đăng ký và hồ sơ chính chủ', () => {
  it('chuẩn hóa email và số +84, gán role mặc định và báo trường bị trùng', async () => {
    const email = `${fixture.prefix}_register@scms.test`.toLowerCase();
    const phone = `08${String(Date.now()).slice(-8)}`;
    const registered = await api.post(apiPath('/auth/register')).send({
      email: ` ${email.toUpperCase()} `,
      phone: `+84${phone.slice(1)}`,
      fullName: '  Người dùng Sprint 1  ',
      password: fixture.password,
      roleId: 1,
    });
    expect(registered.status).toBe(201);
    fixture.userIds.push(registered.body.data.id);
    expect(registered.body.data.email).toBe(email);
    expect(registered.body.data.phone).toBe(phone);
    expect(registered.body.data.passwordHash).toBeUndefined();
    const defaultRole = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
    expect(registered.body.data.role.id).toBe(defaultRole.id);
    const duplicate = await api
      .post(apiPath('/auth/register'))
      .send({ email, fullName: 'Người dùng', password: fixture.password });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.details[0].field).toBe('email');
    const duplicatePhone = await api.post(apiPath('/auth/register')).send({
      email: `${fixture.prefix}_new@scms.test`,
      phone: `+84${phone.slice(1)}`,
      fullName: 'Người dùng',
      password: fixture.password,
    });
    expect(duplicatePhone.status).toBe(409);
    expect(duplicatePhone.body.details[0].field).toBe('phone');
  });

  it('hồ sơ dùng id từ token; chỉ sửa trường liên hệ và ghi audit trước/sau', async () => {
    const own = await api
      .get(apiPath(`/members/me?userId=${fixture.other.id}`))
      .set(bearer(fixture.memberToken));
    expect(own.status).toBe(200);
    expect(own.body.data.id).toBe(fixture.member.id);
    expect(own.body.data.passwordHash).toBeUndefined();
    expect(own.body.data.tokenVersion).toBeUndefined();
    const forbiddenFields = await api
      .patch(apiPath('/members/me'))
      .set(bearer(fixture.memberToken))
      .send({ fullName: 'Tên mới', roleId: 1, status: 'INACTIVE' });
    expect(forbiddenFields.status).toBe(400);
    const saved = await api
      .patch(apiPath('/members/me'))
      .set(bearer(fixture.memberToken))
      .send({ fullName: '  Tên đã cập nhật  ' });
    expect(saved.status).toBe(200);
    expect(saved.body.data.fullName).toBe('Tên đã cập nhật');
    const audit = await prisma.auditLog.findFirst({
      where: { userId: fixture.member.id, entity: 'User', action: 'UPDATE' },
      orderBy: { id: 'desc' },
    });
    expect(audit.meta.before.fullName).toBe(fixture.member.fullName);
    expect(audit.meta.after.fullName).toBe('Tên đã cập nhật');
    const duplicate = await api
      .patch(apiPath('/members/me'))
      .set(bearer(fixture.memberToken))
      .send({ email: fixture.other.email });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.details[0].field).toBe('email');
    const clearedPhone = await api
      .patch(apiPath('/members/me'))
      .set(bearer(fixture.memberToken))
      .send({ phone: null });
    expect(clearedPhone.status).toBe(200);
    expect(clearedPhone.body.data.phone).toBeNull();
  });

  it('người chưa đăng nhập không đọc hoặc cập nhật hồ sơ', async () => {
    expect((await api.get(apiPath('/members/me'))).status).toBe(401);
    expect((await api.patch(apiPath('/members/me')).send({ fullName: 'Tên mới' })).status).toBe(
      401,
    );
  });
});

describe('Sprint 1: đăng nhập, cập nhật và khóa/mở khóa tài khoản', () => {
  it('hội viên không có email có thể đăng nhập bằng số điện thoại', async () => {
    const phone = `09${String(fixture.member.id).padStart(8, '0').slice(-8)}`;
    await prisma.user.update({
      where: { id: fixture.member.id },
      data: { email: null, phone },
    });
    const login = await api
      .post(apiPath('/auth/login'))
      .send({ email: `+84${phone.slice(1)}`, password: fixture.password });
    expect(login.status).toBe(200);
    expect(login.body.data.user.phone).toBe(phone);
    await prisma.user.update({
      where: { id: fixture.member.id },
      data: { email: fixture.member.email },
    });
  });

  it('quản lý cập nhật hội viên bằng PUT đúng contract', async () => {
    const updated = await api
      .put(apiPath(`/members/${fixture.other.id}`))
      .set(bearer(fixture.adminToken))
      .send({ fullName: 'Hội viên đã cập nhật' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.fullName).toBe('Hội viên đã cập nhật');
    expect(
      (await api.patch(apiPath(`/members/${fixture.other.id}`)).set(bearer(fixture.adminToken)))
        .status,
    ).toBe(404);
  });

  it('tài khoản bị khóa không đăng nhập được và có thể được mở khóa lại', async () => {
    const lock = await api
      .patch(apiPath(`/users/${fixture.other.id}/status`))
      .set(bearer(fixture.adminToken))
      .send({ status: 'INACTIVE' });
    expect(lock.status).toBe(200);
    expect(lock.body.message).toContain('khóa');
    const blocked = await api
      .post(apiPath('/auth/login'))
      .send({ email: fixture.other.email, password: fixture.password });
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe(ERROR_CODES.ACCOUNT_INACTIVE);

    const unlock = await api
      .patch(apiPath(`/users/${fixture.other.id}/status`))
      .set(bearer(fixture.adminToken))
      .send({ status: 'ACTIVE' });
    expect(unlock.status).toBe(200);
    expect(unlock.body.message).toContain('mở khóa');
    expect(
      (
        await api
          .post(apiPath('/auth/login'))
          .send({ email: fixture.other.email, password: fixture.password })
      ).status,
    ).toBe(200);
  });
});

describe('Sprint 1: đổi mật khẩu và thu hồi phiên', () => {
  it('mật khẩu cũ sai hoặc mật khẩu mới ngắn bị từ chối, không đổi phiên', async () => {
    const wrong = await api
      .post(apiPath('/auth/password-changes'))
      .set(bearer(fixture.memberToken))
      .send({ currentPassword: 'incorrect', password: 'Updated@Test123' });
    expect(wrong.status).toBe(422);
    expect(wrong.body.details[0].field).toBe('currentPassword');
    const short = await api
      .post(apiPath('/auth/password-changes'))
      .set(bearer(fixture.memberToken))
      .send({ currentPassword: fixture.password, password: 'short' });
    expect(short.status).toBe(400);
    expect((await api.get(apiPath('/auth/me')).set(bearer(fixture.memberToken))).status).toBe(200);
  });

  it('thành công thu hồi tất cả token cũ; audit không chứa mật khẩu', async () => {
    const secondToken = await loginAs(fixture.member.email, fixture.password);
    const newPassword = 'Updated@Test123';
    const changed = await api
      .post(apiPath('/auth/password-changes'))
      .set(bearer(fixture.memberToken))
      .send({ currentPassword: fixture.password, password: newPassword });
    expect(changed.status).toBe(200);
    expect(changed.body.data.requiresLogin).toBe(true);
    expect((await api.get(apiPath('/auth/me')).set(bearer(fixture.memberToken))).status).toBe(401);
    expect((await api.get(apiPath('/auth/me')).set(bearer(secondToken))).status).toBe(401);
    expect(
      (
        await api
          .post(apiPath('/auth/login'))
          .send({ email: fixture.member.email, password: fixture.password })
      ).status,
    ).toBe(401);
    const newToken = await loginAs(fixture.member.email, newPassword);
    expect((await api.get(apiPath('/auth/me')).set(bearer(newToken))).status).toBe(200);
    const audit = await prisma.auditLog.findFirst({
      where: { userId: fixture.member.id, meta: { path: '$.passwordChanged', equals: true } },
    });
    expect(audit.meta.sessionsRevoked).toBe(true);
    expect(JSON.stringify(audit.meta)).not.toContain(newPassword);
    expect(JSON.stringify(audit.meta)).not.toContain(fixture.password);
  });
});
