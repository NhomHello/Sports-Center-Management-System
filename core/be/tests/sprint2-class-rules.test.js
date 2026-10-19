import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { api, apiPath, bearer } from './helpers/api.js';
import { classPayload, createClassFixture, cleanupClassFixture } from './helpers/sprint2.js';
import { prisma } from '../src/config/db.js';

let f;
const DAY_MS = 86400000;
const send = (method, path, token, data) =>
  api[method](apiPath(path)).set(bearer(token)).send(data);
const enroll = (id, token) => send('post', `/classes/${id}/enrollments/me`, token);
const cancelMine = (id, token) => send('delete', `/classes/${id}/enrollments/me`, token);
const createRaw = (data = {}) => send('post', '/classes', f.adminToken, classPayload(f, data));
const create = async (data) => {
  const res = await createRaw(data);
  expect(res.status).toBe(201);
  return res.body.data;
};
/** Cùng ngày với lớp mặc định nhưng khác khung giờ; đổi phòng/HLV để chỉ còn xung đột của hội viên. */
const slot = (startTime, endTime) => {
  const { weeklySchedule } = classPayload(f);
  return {
    weeklySchedule: [{ ...weeklySchedule[0], startTime, endTime }],
    roomId: f.roomOther.id,
    coachId: f.coachOther.id,
  };
};

describe('Sprint 2: quy tắc xếp lớp và ca biên (BR-2.x)', () => {
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
    await prisma.user.updateMany({ where: { id: f.member.id }, data: { status: 'ACTIVE' } });
  });
  afterAll(async () => {
    await cleanupClassFixture(f);
    await prisma.$disconnect();
  });

  it('TC-F2-K01 (BR-2.9): sức chứa mới không nhỏ hơn số đã đăng ký; bằng thì được', async () => {
    const item = await create({ capacity: 3 });
    await enroll(item.id, f.memberToken);
    await enroll(item.id, f.otherToken);
    const update = (capacity) =>
      send('put', `/classes/${item.id}`, f.adminToken, classPayload(f, { capacity }));
    expect((await update(1)).status).toBe(422);
    expect((await update(2)).status).toBe(200);
  });

  it('TC-F2-K02 (BR-2.10): sức chứa lớp không vượt sức chứa phòng, tạo và sửa đều chặn', async () => {
    expect((await createRaw({ capacity: 11 })).status).toBe(422);
    const item = await create({ capacity: 10 });
    const res = await send(
      'put',
      `/classes/${item.id}`,
      f.adminToken,
      classPayload(f, { capacity: 11 }),
    );
    expect(res.status).toBe(422);
  });

  it('TC-F2-K03 (BR-2.11): lịch sai bị từ chối trước khi sinh buổi học', async () => {
    const base = classPayload(f);
    const cases = {
      'ngày kết thúc trước ngày bắt đầu': {
        endsOn: new Date(Date.parse(base.startsOn) - DAY_MS).toISOString().split('T')[0],
      },
      'giờ kết thúc không sau giờ bắt đầu': {
        weeklySchedule: [{ ...base.weeklySchedule[0], endTime: '18:00' }],
      },
      'không có buổi nào mỗi tuần': { weeklySchedule: [] },
      'đóng đăng ký không sau lúc mở': { registrationEndAt: base.registrationStartAt },
    };
    for (const [label, override] of Object.entries(cases)) {
      const res = await createRaw(override);
      expect(res.status, label).toBe(400);
    }
    const late = await createRaw({
      registrationEndAt: new Date(Date.now() + 40 * DAY_MS).toISOString(),
    });
    expect(late.status).toBe(422);
  });

  it('TC-F2-K04 (BR-2.13): không phân công HLV bị khoá hoặc người không có quyền dạy', async () => {
    await prisma.user.update({ where: { id: f.coachOther.id }, data: { status: 'INACTIVE' } });
    expect((await createRaw({ coachId: f.coachOther.id })).status).toBe(422);
    await prisma.user.update({ where: { id: f.coachOther.id }, data: { status: 'ACTIVE' } });
    expect((await createRaw({ coachId: f.member.id })).status).toBe(422);
    expect((await createRaw({ coachId: f.coachOther.id })).status).toBe(201);
  });

  it('TC-F2-K05 (BR-2.3/2.8): hai buổi liền nhau không trùng, chồng một phút thì trùng', async () => {
    const first = await create();
    const next = await create(slot('19:00', '20:00'));
    expect((await enroll(first.id, f.memberToken)).status).toBe(201);
    expect((await enroll(next.id, f.memberToken)).status).toBe(201);
    await send('delete', `/classes/${first.id}`, f.adminToken);
    const overlap = await create({ weeklySchedule: slot('18:00', '19:01').weeklySchedule });
    const blocked = await enroll(overlap.id, f.memberToken);
    expect(blocked.status).toBe(422);
    expect(blocked.body.message).toContain('Trùng lịch');
  });

  it('TC-F2-K06: huỷ đăng ký trả chỗ; đăng ký lại dùng lại bản ghi cũ', async () => {
    const item = await create({ capacity: 1 });
    const first = await enroll(item.id, f.memberToken);
    expect((await enroll(item.id, f.otherToken)).status).toBe(422);
    expect((await cancelMine(item.id, f.memberToken)).status).toBe(200);
    expect((await enroll(item.id, f.otherToken)).status).toBe(201);
    expect((await enroll(item.id, f.memberToken)).status).toBe(422);
    await cancelMine(item.id, f.otherToken);
    const again = await enroll(item.id, f.memberToken);
    expect(again.status).toBe(201);
    expect(again.body.data.id).toBe(first.body.data.id);
  });

  it('TC-F2-K07 (BR-2.6): lớp đã đóng hoặc đã huỷ không nhận đăng ký', async () => {
    const closed = await create({ status: 'CLOSED' });
    const res = await enroll(closed.id, f.memberToken);
    expect(res.status).toBe(422);
    const cancelled = await create({ roomId: f.roomOther.id, coachId: f.coachOther.id });
    await send('delete', `/classes/${cancelled.id}`, f.adminToken);
    expect((await enroll(cancelled.id, f.memberToken)).status).toBe(422);
  });

  it('TC-F2-K08: huỷ cả lớp giải phóng lịch của hội viên cho lớp trùng giờ', async () => {
    const a = await create();
    const b = await create({ roomId: f.roomOther.id, coachId: f.coachOther.id });
    await enroll(a.id, f.memberToken);
    expect((await enroll(b.id, f.memberToken)).status).toBe(422);
    await send('delete', `/classes/${a.id}`, f.adminToken);
    expect((await enroll(b.id, f.memberToken)).status).toBe(201);
  });

  it('TC-F2-K09 (BR-2.1): membership chưa tới ngày bắt đầu hoặc tài khoản bị khoá đều bị chặn, đúng lý do', async () => {
    const item = await create();
    await prisma.membership.updateMany({
      where: { userId: f.member.id },
      data: { startDate: new Date(Date.now() + DAY_MS) },
    });
    const early = await enroll(item.id, f.memberToken);
    expect(early.body.message).toContain('gói tập còn hiệu lực');
    await prisma.membership.updateMany({
      where: { userId: f.member.id },
      data: { startDate: new Date(Date.now() - DAY_MS) },
    });
    await prisma.user.update({ where: { id: f.member.id }, data: { status: 'INACTIVE' } });
    const forMember = await send('post', `/classes/${item.id}/enrollments`, f.adminToken, {
      memberId: f.member.id,
    });
    expect(forMember.status).toBe(422);
    expect(forMember.body.message).toBe('Tài khoản hội viên đã bị khoá');
  });
});
