import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './helpers/sprint2.js';
let f;
let item;
const started = new Date();
const call = (method, path, body, token = f.adminToken) =>
  api[method](apiPath(path)).set(bearer(token)).send(body);
beforeAll(async () => {
  f = await createClassFixture();
  await prisma.rolePermission.create({
    data: {
      roleId: f.coach.roleId,
      permissionId: (await prisma.permission.findUnique({ where: { code: P.ATTENDANCE_RECORD } }))
        .id,
    },
  });
  const res = await call('post', '/classes', classPayload(f));
  expect(res.status).toBe(201);
  item = res.body.data;
  await call('post', `/classes/${item.id}/enrollments/me`, {}, f.memberToken);
});
afterAll(async () => {
  if (!f) return;
  await prisma.attendance.deleteMany({ where: { memberId: { in: f.userIds } } });
  await prisma.roomMaintenance.deleteMany({
    where: { roomId: { in: [f.room.id, f.roomOther.id] } },
  });
  await prisma.auditLog.deleteMany({ where: { userId: f.admin.id, createdAt: { gte: started } } });
  await cleanupClassFixture(f);
});

describe('Bảo trì phòng', () => {
  it('xem trước phòng trống rồi chuyển một buổi, giữ các buổi khác', async () => {
    const s = item.sessions[0];
    const range = { startAt: s.startAt, endAt: s.endAt };
    const preview = await api
      .get(apiPath(`/rooms/${f.room.id}/maintenance-preview`))
      .set(bearer(f.adminToken))
      .query(range);
    expect(preview.status).toBe(200);
    expect(preview.body.data[0].suggestions.some((r) => r.id === f.roomOther.id)).toBe(true);
    const res = await call('post', `/rooms/${f.room.id}/maintenance`, {
      ...range,
      reason: 'Bảo trì sàn',
      assignments: [{ sessionId: s.id, roomId: f.roomOther.id }],
    });
    expect(res.status).toBe(201);
    expect((await prisma.classSession.findUnique({ where: { id: s.id } })).roomId).toBe(
      f.roomOther.id,
    );
    expect(
      (await prisma.classSession.findUnique({ where: { id: item.sessions[1].id } })).roomId,
    ).toBe(f.room.id);
  });
  it('phòng bảo trì không được dùng lại; thiếu assignments rollback toàn bộ', async () => {
    const s = item.sessions[0];
    expect(
      (
        await call('patch', `/classes/sessions/${item.sessions[1].id}`, {
          startAt: s.startAt,
          endAt: s.endAt,
        })
      ).status,
    ).toBe(409);
    const count = await prisma.roomMaintenance.count({ where: { roomId: f.room.id } });
    const next = item.sessions[1];
    expect(
      (
        await call('post', `/rooms/${f.room.id}/maintenance`, {
          startAt: next.startAt,
          endAt: next.endAt,
          reason: 'Bảo trì',
          assignments: [],
        })
      ).status,
    ).toBe(409);
    expect(await prisma.roomMaintenance.count({ where: { roomId: f.room.id } })).toBe(count);
  });
  it('buổi không chuyển được được huỷ và không xoá lịch sử', async () => {
    const s = item.sessions[1];
    expect(
      (
        await call('post', `/rooms/${f.room.id}/maintenance`, {
          startAt: s.startAt,
          endAt: s.endAt,
          reason: 'Không còn phòng khác',
          assignments: [{ sessionId: s.id, roomId: null }],
        })
      ).status,
    ).toBe(201);
    expect((await prisma.classSession.findUnique({ where: { id: s.id } })).status).toBe(
      'CANCELLED',
    );
  });
});
