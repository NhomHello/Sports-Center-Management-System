import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, apiPath, bearer } from './helpers/api.js';
import { classPayload, createClassFixture, cleanupClassFixture } from './helpers/sprint2.js';
import { prisma } from '../src/config/db.js';

let f;
let otherSubject;
const post = (path, body) => api.post(apiPath(path)).set(bearer(f.adminToken)).send(body);
const put = (path, body) => api.put(apiPath(path)).set(bearer(f.adminToken)).send(body);

describe('Góp ý GV – GĐ1: khung giờ, loại phòng, chuyên môn HLV', () => {
  beforeAll(async () => {
    f = await createClassFixture();
    otherSubject = await prisma.subject.create({ data: { name: `${f.prefix} Other Subject` } });
  });
  afterAll(async () => {
    const classes = await prisma.gymClass.findMany({ where: { subjectId: otherSubject.id } });
    const classId = { in: classes.map((c) => c.id) };
    await prisma.classEvent.deleteMany({ where: { classId } });
    await prisma.classSession.deleteMany({ where: { classId } });
    await prisma.gymClass.deleteMany({ where: { id: classId } });
    await prisma.coachSubject.deleteMany({ where: { subjectId: otherSubject.id } });
    await cleanupClassFixture(f);
    await prisma.subject.delete({ where: { id: otherSubject.id } });
    await prisma.$disconnect();
  });

  it('giờ học phải nằm trọn trong một khung giờ hoạt động', async () => {
    const res = await post(
      '/classes',
      classPayload(f, {
        weeklySchedule: [{ dayOfWeek: 1, startTime: '12:30', endTime: '13:30' }],
      }),
    );
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('khung giờ hoạt động');
  });

  it('phòng phải thuộc loại phòng dạy được bộ môn của lớp', async () => {
    const res = await post('/classes', classPayload(f, { subjectId: otherSubject.id }));
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('không dùng cho bộ môn này');
  });

  it('HLV phải có chuyên môn bộ môn; khai báo chuyên môn qua API tài khoản', async () => {
    await prisma.roomTypeSubject.create({
      data: { roomTypeId: f.roomType.id, subjectId: otherSubject.id },
    });
    const denied = await post('/classes', classPayload(f, { subjectId: otherSubject.id }));
    expect(denied.status).toBe(422);
    expect(denied.body.message).toContain('chưa có chuyên môn');
    const granted = await put(`/users/${f.coach.id}/subjects`, {
      subjectIds: [f.subject.id, otherSubject.id],
    });
    expect(granted.status).toBe(200);
    const created = await post(
      '/classes',
      classPayload(f, { subjectId: otherSubject.id, name: 'GĐ1 lớp môn khác' }),
    );
    expect(created.status).toBe(201);
    await prisma.roomTypeSubject.delete({
      where: { roomTypeId_subjectId: { roomTypeId: f.roomType.id, subjectId: otherSubject.id } },
    });
  });

  it('không bỏ chuyên môn khi HLV còn dạy lớp của bộ môn đó', async () => {
    const res = await put(`/users/${f.coach.id}/subjects`, { subjectIds: [f.subject.id] });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('còn dạy lớp');
  });

  it('xem trước khi sửa lớp: báo số buổi đổi và học viên đang học', async () => {
    const base = classPayload(f);
    const payload = {
      ...base,
      name: 'GĐ1 xem trước',
      weeklySchedule: [{ ...base.weeklySchedule[0], startTime: '20:00', endTime: '21:00' }],
    };
    const created = await post('/classes', payload);
    expect(created.status).toBe(201);
    const preview = await post(`/classes/${created.body.data.id}/update-preview`, {
      ...payload,
      weeklySchedule: [{ ...payload.weeklySchedule[0], startTime: '21:00', endTime: '22:00' }],
    });
    expect(preview.status).toBe(200);
    expect(preview.body.data).toMatchObject({ enrolledCount: 0, conflicts: [] });
    expect(preview.body.data.cancelled).toBeGreaterThan(0);
    expect(preview.body.data.added).toBe(preview.body.data.cancelled);
  });
});
