import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { createClassFixture, cleanupClassFixture, classPayload } from './helpers/sprint2.js';
let f;
let item;
const HOUR = 3600000;
const DAY = 86400000;
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

describe('Điểm danh và luật vắng mặt', () => {
  let past;
  it('chỉ HLV phụ trách hoặc quản lý được điểm danh', async () => {
    past = await prisma.classSession.create({
      data: {
        classId: item.id,
        coachId: f.coach.id,
        roomId: f.room.id,
        startAt: new Date(Date.now() - HOUR),
        endAt: new Date(Date.now() + HOUR),
      },
    });
    await prisma.classEnrollment.updateMany({
      where: { classId: item.id, memberId: f.member.id },
      data: { enrolledAt: new Date(Date.now() - DAY) },
    });
    const entries = [{ memberId: f.member.id, status: 'PRESENT' }];
    expect(
      (await call('put', `/classes/sessions/${past.id}/attendance`, { entries }, f.coachOtherToken))
        .status,
    ).toBe(403);
    expect(
      (await call('put', `/classes/sessions/${past.id}/attendance`, { entries }, f.coachToken))
        .status,
    ).toBe(200);
    const absent = [{ memberId: f.member.id, status: 'ABSENT' }];
    expect(
      (await call('put', `/classes/sessions/${past.id}/attendance`, { entries: absent }, f.coachToken))
        .status,
    ).toBe(200);
    expect(
      (await call('put', `/classes/sessions/${past.id}/attendance`, { entries }, f.coachToken))
        .status,
    ).toBe(200);
    expect(
      await prisma.attendance.findUnique({
        where: { sessionId_memberId: { sessionId: past.id, memberId: f.member.id } },
      }),
    ).toMatchObject({ status: 'PRESENT' });
    expect(
      (
        await call('put', `/classes/sessions/${past.id}/attendance`, {
          entries: [{ memberId: f.other.id, status: 'PRESENT' }],
        })
      ).status,
    ).toBe(422);
  });
  it('quá hạn cần quản lý mở, buổi huỷ không thể điểm danh kể cả đã mở', async () => {
    await prisma.classSession.update({
      where: { id: past.id },
      data: {
        startAt: new Date(Date.now() - 3 * DAY),
        endAt: new Date(Date.now() - 2 * DAY),
      },
    });
    await prisma.classEnrollment.updateMany({
      where: { classId: item.id, memberId: f.member.id },
      data: { enrolledAt: new Date(Date.now() - 5 * DAY) },
    });
    const entries = [{ memberId: f.member.id, status: 'ABSENT' }];
    expect(
      (await call('put', `/classes/sessions/${past.id}/attendance`, { entries }, f.coachToken))
        .status,
    ).toBe(422);
    expect((await call('put', `/classes/sessions/${past.id}/attendance`, { entries })).status).toBe(
      422,
    );
    expect(
      (
        await call(
          'post',
          `/classes/sessions/${past.id}/attendance-unlock`,
          { reason: 'Sửa sai dữ liệu' },
          f.coachToken,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call('post', `/classes/sessions/${past.id}/attendance-unlock`, {
          reason: 'Sửa sai dữ liệu',
        })
      ).status,
    ).toBe(200);
    expect(
      (await call('put', `/classes/sessions/${past.id}/attendance`, { entries }, f.coachToken))
        .status,
    ).toBe(200);
    await prisma.classSession.update({ where: { id: past.id }, data: { status: 'CANCELLED' } });
    expect((await call('put', `/classes/sessions/${past.id}/attendance`, { entries })).status).toBe(
      422,
    );
  });
  it('3 buổi vắng hợp lệ chặn đăng ký, gỡ kèm lý do giữ booking đang có', async () => {
    for (let i = 0; i < 3; i += 1) {
      const s = await prisma.classSession.create({
        data: {
          classId: item.id,
          coachId: f.coach.id,
          roomId: f.room.id,
          startAt: new Date(Date.now() - (6 + i * 2) * HOUR),
          endAt: new Date(Date.now() - (5 + i * 2) * HOUR),
        },
      });
      expect(
        (
          await call(
            'post',
            `/classes/sessions/${s.id}/attendance-unlock`,
            { reason: 'Kiểm thử vắng mặt sau buổi' },
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await call('put', `/classes/sessions/${s.id}/attendance`, {
            entries: [{ memberId: f.member.id, status: 'ABSENT' }],
          })
        ).status,
      ).toBe(200);
    }
    expect(
      (await prisma.user.findUnique({ where: { id: f.member.id } })).bookingBlockedUntil >
        new Date(),
    ).toBe(true);
    expect(
      await prisma.classEnrollment.count({
        where: { classId: item.id, memberId: f.member.id, status: 'BOOKED' },
      }),
    ).toBe(1);
    expect(
      (await call('post', `/members/${f.member.id}/booking-unblock`, { reason: '' })).status,
    ).toBe(400);
    expect(
      (
        await call('post', `/members/${f.member.id}/booking-unblock`, {
          reason: 'Đã xác nhận lý do nghỉ',
        })
      ).status,
    ).toBe(200);
    expect(
      (await prisma.user.findUnique({ where: { id: f.member.id } })).bookingBlockedUntil,
    ).toBeNull();
  });
});
