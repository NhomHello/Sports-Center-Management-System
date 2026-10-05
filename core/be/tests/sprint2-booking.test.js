import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { api, apiPath, bearer } from './helpers/api.js';
import { classPayload, createClassFixture, cleanupClassFixture } from './helpers/sprint2.js';
import { prisma } from '../src/config/db.js';
import { getClassActions } from '../src/modules/class/class-booking-policy.service.js';
import { CLASS_INCLUDE } from '../src/modules/class/class.mapper.js';
import { refreshCancellationExceptions } from '../src/modules/class/class-exception.service.js';

let f;
const DAY_MS = 86400000;
const post = (path, token, data = {}) => api.post(apiPath(path)).set(bearer(token)).send(data);
const remove = (path, token) => api.delete(apiPath(path)).set(bearer(token));
const enroll = (id, token) => post(`/classes/${id}/enrollments/me`, token);
const create = async (data = {}) => {
  const res = await post('/classes', f.adminToken, classPayload(f, data));
  expect(res.status).toBe(201);
  return res.body.data;
};
describe('Sprint 2: booking toàn lớp và phân quyền lịch', () => {
  beforeAll(async () => {
    f = await createClassFixture();
  });
  beforeEach(async () => {
    const scope = { gymClass: { subjectId: f.subject.id } };
    await prisma.classSession.updateMany({ where: scope, data: { status: 'CANCELLED' } });
    await prisma.gymClass.updateMany({
      where: { subjectId: f.subject.id },
      data: { status: 'CANCELLED' },
    });
    await prisma.classEnrollment.updateMany({ where: scope, data: { status: 'CANCELLED' } });
    await prisma.membership.updateMany({
      where: { planId: f.plan.id },
      data: { endDate: new Date(Date.now() + 90 * DAY_MS) },
    });
  });
  afterAll(async () => {
    await cleanupClassFixture(f);
    await prisma.$disconnect();
  });
  it('hai người tranh chỗ cuối chỉ một người giữ được chỗ', async () => {
    const item = await create({ capacity: 1 });
    const results = await Promise.all([
      enroll(item.id, f.memberToken),
      enroll(item.id, f.otherToken),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect(
      await prisma.classEnrollment.count({ where: { classId: item.id, status: 'BOOKED' } }),
    ).toBe(1);
  });
  it('đăng ký trùng 409, membership hết hạn bị chặn', async () => {
    const item = await create();
    expect((await enroll(item.id, f.memberToken)).status).toBe(201);
    expect((await enroll(item.id, f.memberToken)).status).toBe(409);
    await prisma.membership.updateMany({
      where: { userId: f.other.id },
      data: { endDate: new Date(Date.now() - DAY_MS) },
    });
    expect((await enroll(item.id, f.otherToken)).status).toBe(422);
  });
  it('lớp ngoài cửa sổ đăng ký không được giữ chỗ', async () => {
    const item = await create({ registrationStartAt: new Date(Date.now() + DAY_MS).toISOString() });
    expect((await enroll(item.id, f.memberToken)).status).toBe(422);
    expect(await prisma.classEnrollment.count({ where: { classId: item.id } })).toBe(0);
  });
  it('đăng ký đồng thời hai lớp trùng giờ chỉ thành công một lớp', async () => {
    const a = await create();
    const b = await create({ roomId: f.roomOther.id, coachId: f.coachOther.id });
    const results = await Promise.all([enroll(a.id, f.memberToken), enroll(b.id, f.memberToken)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
  });
  it('đăng ký/huỷ hộ lưu đúng actor, hội viên không dùng được endpoint hộ', async () => {
    const item = await create();
    expect(
      (await post(`/classes/${item.id}/enrollments`, f.memberToken, { memberId: f.other.id }))
        .status,
    ).toBe(403);
    const booked = await post(`/classes/${item.id}/enrollments`, f.adminToken, {
      memberId: f.member.id,
    });
    expect(booked.body.data.enrolledBy).toBe(f.admin.id);
    const cancelled = await remove(`/classes/${item.id}/enrollments/${f.member.id}`, f.adminToken);
    expect(cancelled.body.data.cancelledBy).toBe(f.admin.id);
    const again = await remove(`/classes/${item.id}/enrollments/${f.member.id}`, f.adminToken);
    expect(again.body.data.cancelledAt).toBe(cancelled.body.data.cancelledAt);
  });
  it('huỷ quá hạn giữ booking, kể cả người quản lý huỷ hộ', async () => {
    const item = await create();
    await enroll(item.id, f.memberToken);
    await prisma.classSession.updateMany({
      where: { classId: item.id },
      data: { status: 'CANCELLED' },
    });
    await prisma.classSession.create({
      data: {
        classId: item.id,
        startAt: new Date(Date.now() + 3600000),
        endAt: new Date(Date.now() + 7200000),
      },
    });
    expect((await remove(`/classes/${item.id}/enrollments/me`, f.memberToken)).status).toBe(422);
    expect(
      (await remove(`/classes/${item.id}/enrollments/${f.member.id}`, f.adminToken)).status,
    ).toBe(422);
    expect((await prisma.classEnrollment.findFirst({ where: { classId: item.id } })).status).toBe(
      'BOOKED',
    );
  });
  it('membership hết hạn giữa kỳ vẫn xem lịch cũ, không xem lịch của người khác', async () => {
    const item = await create();
    await enroll(item.id, f.memberToken);
    await prisma.membership.updateMany({
      where: { userId: f.member.id },
      data: { endDate: new Date(Date.now() - DAY_MS) },
    });
    const first = new Date(item.sessions[0].startAt);
    const weekday = first.getUTCDay();
    const monday = new Date(first.getTime() - ((weekday + 6) % 7) * DAY_MS)
      .toISOString()
      .split('T')[0];
    const own = await api
      .get(apiPath('/schedule/me'))
      .query({ weekStart: monday })
      .set(bearer(f.memberToken));
    expect(own.status).toBe(200);
    expect(own.body.data.some((s) => s.classId === item.id)).toBe(true);
    const other = await api
      .get(apiPath('/schedule/me'))
      .query({ weekStart: monday })
      .set(bearer(f.otherToken));
    expect(other.body.data).toEqual([]);
    expect(
      (await api.get(apiPath(`/members/${f.member.id}/enrollments`)).set(bearer(f.otherToken)))
        .status,
    ).toBe(403);
  });
  it('HLV chỉ xem lớp/roster được phân công, roster không có dữ liệu bí mật', async () => {
    const item = await create();
    await enroll(item.id, f.memberToken);
    const roster = await api.get(apiPath(`/classes/${item.id}/roster`)).set(bearer(f.coachToken));
    expect(roster.status).toBe(200);
    expect(roster.body.data.items[0].member).not.toHaveProperty('passwordHash');
    expect(
      (await api.get(apiPath(`/classes/${item.id}/roster`)).set(bearer(f.coachOtherToken))).status,
    ).toBe(403);
    const list = await api
      .get(apiPath('/classes'))
      .query({ scope: 'management' })
      .set(bearer(f.coachOtherToken));
    expect(list.body.data.every((c) => c.coachId === f.coachOther.id)).toBe(true);
    expect(list.body.data.some((c) => c.id === item.id)).toBe(false);
  });
  it('ngoại lệ chỉ được tạo bởi đổi lịch gây xung đột thực sự', async () => {
    const a = await create();
    const b = await create({
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
      weeklySchedule: [{ ...a.weeklySchedule[0], startTime: '20:00', endTime: '21:00' }],
    });
    await enroll(a.id, f.memberToken);
    await enroll(b.id, f.memberToken);
    const changed = await api
      .put(apiPath(`/classes/${a.id}`))
      .set(bearer(f.adminToken))
      .send(classPayload(f, { weeklySchedule: b.weeklySchedule }));
    expect(changed.status).toBe(200);
    const first = new Date(Date.now() + 3600000);
    await prisma.classSession.updateMany({
      where: { classId: { in: [a.id, b.id] } },
      data: { status: 'CANCELLED' },
    });
    const sessions = [];
    for (const id of [a.id, b.id])
      sessions.push(
        await prisma.classSession.create({
          data: {
            classId: id,
            startAt: first,
            endAt: new Date(first.getTime() + 3600000),
          },
        }),
      );
    await refreshCancellationExceptions(
      prisma,
      a.id,
      sessions.filter((s) => s.classId === a.id),
    );
    const raw = await prisma.gymClass.findUnique({ where: { id: a.id }, include: CLASS_INCLUDE });
    expect((await getClassActions(prisma, raw, f.member.id)).cancellationExceptionUntil).toEqual(
      first,
    );
    expect((await remove(`/classes/${a.id}/enrollments/me`, f.memberToken)).status).toBe(200);
  });
});
