import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, apiPath, bearer } from './helpers/api.js';
import { classPayload, createClassFixture, cleanupClassFixture } from './helpers/sprint2.js';
import { prisma } from '../src/config/db.js';
import { drainClassEvents } from '../src/modules/class/class-event.service.js';

let f;
let item;
describe('Sprint 2: danh mục, cấu hình lớp và outbox', () => {
  beforeAll(async () => {
    f = await createClassFixture();
  });
  afterAll(async () => {
    await cleanupClassFixture(f);
    await prisma.$disconnect();
  });
  it('tạo lịch UTC, chỉ trả thông tin HLV công khai', async () => {
    const result = await api
      .post(apiPath('/classes'))
      .set(bearer(f.adminToken))
      .send(classPayload(f));
    expect(result.status).toBe(201);
    item = result.body.data;
    expect(item.sessions.length).toBeGreaterThan(1);
    expect(item.sessions[0].startAt).toContain('T11:00:00');
    expect(item.coach).not.toHaveProperty('passwordHash');
  });
  it('chặn trùng phòng/HLV nhưng cho phép hai buổi liền nhau', async () => {
    const blocked = await api
      .post(apiPath('/classes'))
      .set(bearer(f.adminToken))
      .send(classPayload(f, { name: 'Duplicate resources' }));
    expect(blocked.status).toBe(409);
    const adjacent = await api
      .post(apiPath('/classes'))
      .set(bearer(f.adminToken))
      .send(
        classPayload(f, {
          weeklySchedule: [{ ...item.weeklySchedule[0], startTime: '19:00', endTime: '20:00' }],
        }),
      );
    expect(adjacent.status).toBe(201);
  });
  it('không ngừng phòng/bộ môn hoặc khoá HLV còn lớp đang dùng', async () => {
    expect(
      (await api.delete(apiPath(`/rooms/${f.room.id}`)).set(bearer(f.adminToken))).status,
    ).toBe(422);
    expect(
      (await api.delete(apiPath(`/subjects/${f.subject.id}`)).set(bearer(f.adminToken))).status,
    ).toBe(422);
    expect(
      (
        await api
          .patch(apiPath(`/users/${f.coach.id}/status`))
          .set(bearer(f.adminToken))
          .send({ status: 'INACTIVE' })
      ).status,
    ).toBe(422);
  });
  it('đổi lịch giữ phiên bản cũ và gửi thông báo idempotent', async () => {
    await prisma.classEnrollment.create({
      data: {
        classId: item.id,
        memberId: f.member.id,
        enrolledBy: f.member.id,
      },
    });
    const changed = await api
      .put(apiPath(`/classes/${item.id}`))
      .set(bearer(f.adminToken))
      .send(
        classPayload(f, {
          weeklySchedule: [{ ...item.weeklySchedule[0], startTime: '20:00', endTime: '21:00' }],
        }),
      );
    expect(changed.status).toBe(200);
    expect(changed.body.data.sessions.some((s) => s.status === 'CANCELLED')).toBe(true);
    await drainClassEvents();
    await drainClassEvents();
    expect(
      await prisma.notification.count({ where: { userId: f.member.id, kind: 'CLASS_CHANGED' } }),
    ).toBe(1);
  });
  it('huỷ lớp giữ lịch sử đăng ký, huỷ lại không thêm thông báo', async () => {
    expect(
      (await api.delete(apiPath(`/classes/${item.id}`)).set(bearer(f.adminToken))).status,
    ).toBe(200);
    expect(
      (await api.delete(apiPath(`/classes/${item.id}`)).set(bearer(f.adminToken))).status,
    ).toBe(200);
    const booking = await prisma.classEnrollment.findFirst({ where: { classId: item.id } });
    expect(booking.status).toBe('CANCELLED');
    await drainClassEvents();
    expect(
      await prisma.notification.count({ where: { userId: f.member.id, kind: 'CLASS_CANCELLED' } }),
    ).toBe(1);
  });
});
