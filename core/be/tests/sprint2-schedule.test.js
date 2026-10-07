import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import {
  DAY,
  HOUR,
  cleanupBookingFixture,
  createBookingFixture,
  createClass,
  inFuture,
} from './helpers/sprint2.js';

let f;
let classA; // coach A, 2 buổi
let classB; // coach B
beforeAll(async () => {
  f = await createBookingFixture();
  classA = await createClass(f, {
    name: 'A',
    sessions: [
      [2 * DAY, HOUR],
      [4 * DAY, HOUR],
    ],
  });
  classB = await createClass(f, { name: 'B', coach: f.users.coachB, sessions: [[2 * DAY, HOUR]] });
  await prisma.enrollment.createMany({
    data: [
      { sessionId: classA.sessions[0].id, userId: f.users.m1.id },
      {
        sessionId: classA.sessions[1].id,
        userId: f.users.m1.id,
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      { sessionId: classA.sessions[0].id, userId: f.users.m2.id, enrolledById: f.users.staff.id },
    ],
  });
});
afterAll(async () => cleanupBookingFixture(f));

const get = (path, token) => api.get(apiPath(path)).set(bearer(token));
const isoDay = (date) => date.toISOString().slice(0, 10);
const range = `from=${isoDay(inFuture(DAY))}&to=${isoDay(inFuture(6 * DAY))}`;

describe('UC-CB-16: lịch tập cá nhân', () => {
  it('S01: chỉ lịch của chính mình, gồm booking đã huỷ và trạng thái từng buổi', async () => {
    const res = await get(`/schedule/me?${range}`, f.token.m1);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.map((item) => item.bookingStatus).sort()).toEqual(['BOOKED', 'CANCELLED']);
    expect(res.body.data[0].class).toMatchObject({ name: `${f.prefix} A` });
    expect(res.body.data[0].class.room.name).toBe(`${f.prefix} Room`);
    const other = await get(`/schedule/me?${range}`, f.token.m3);
    expect(other.body.data).toEqual([]);
  });

  it('S02: lọc theo khoảng ngày giờ Việt Nam; sai khoảng => 400; mặc định không lỗi', async () => {
    const narrow = await get(
      `/schedule/me?from=${isoDay(inFuture(2 * DAY))}&to=${isoDay(inFuture(2 * DAY))}`,
      f.token.m1,
    );
    expect(narrow.body.data).toHaveLength(1);
    expect((await get('/schedule/me?from=2026-10-10&to=2026-10-01', f.token.m1)).status).toBe(400);
    expect((await get('/schedule/me?from=2026-01-01&to=2026-12-31', f.token.m1)).status).toBe(400);
    expect((await get('/schedule/me?from=abc', f.token.m1)).status).toBe(400);
    expect((await get('/schedule/me', f.token.m1)).status).toBe(200);
  });

  it('S03: gói hết hạn giữa kỳ vẫn thấy booking đã có (BR-1.12)', async () => {
    await prisma.membership.updateMany({
      where: { userId: f.users.m1.id },
      data: { endDate: new Date(Date.now() - HOUR) },
    });
    const res = await get(`/schedule/me?${range}`, f.token.m1);
    expect(res.body.data).toHaveLength(2);
  });

  it('S04: không đăng nhập => 401; coach không có quyền xem lịch cá nhân => 403', async () => {
    expect((await api.get(apiPath('/schedule/me'))).status).toBe(401);
    expect((await get('/schedule/me', f.token.coachA)).status).toBe(403);
  });
});

describe('UC-CB-11: lịch dạy', () => {
  it('T01: coach chỉ thấy buổi của lớp mình kèm số người đã đặt', async () => {
    const res = await get(`/schedule/teaching?${range}`, f.token.coachA);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((item) => item.class.coach.id === f.users.coachA.id)).toBe(true);
    expect(res.body.data[0].bookedCount).toBe(2);
    const b = await get(`/schedule/teaching?${range}`, f.token.coachB);
    expect(b.body.data).toHaveLength(1);
  });

  it('T02: xem lịch coach khác => 403, quản lý (class.read_all) được xem', async () => {
    const asCoach = await get(
      `/schedule/teaching?${range}&coachId=${f.users.coachB.id}`,
      f.token.coachA,
    );
    expect(asCoach.status).toBe(403);
    const asAdmin = await get(
      `/schedule/teaching?${range}&coachId=${f.users.coachB.id}`,
      f.token.admin,
    );
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.data).toHaveLength(1);
  });

  it('T03: hội viên không có quyền xem lịch dạy => 403', async () => {
    expect((await get('/schedule/teaching', f.token.m1)).status).toBe(403);
  });
});

describe('UC-CB-17: quản lý lớp (danh sách, chi tiết)', () => {
  it('M01: quản lý thấy mọi lớp và lọc theo coach/trạng thái/ngày; coach chỉ thấy lớp mình', async () => {
    const all = await get(`/class-management/classes?search=${f.prefix}`, f.token.admin);
    expect(all.status).toBe(200);
    expect(all.body.meta.total).toBe(2);
    const byCoach = await get(
      `/class-management/classes?search=${f.prefix}&coachId=${f.users.coachB.id}`,
      f.token.admin,
    );
    expect(byCoach.body.data.map((c) => c.name)).toEqual([`${f.prefix} B`]);
    const byDay = await get(
      `/class-management/classes?search=${f.prefix}&date=${isoDay(inFuture(4 * DAY))}`,
      f.token.admin,
    );
    expect(byDay.body.data.map((c) => c.name)).toEqual([`${f.prefix} A`]);
    const closed = await get(
      `/class-management/classes?search=${f.prefix}&status=CLOSED`,
      f.token.admin,
    );
    expect(closed.body.data).toEqual([]);

    const own = await get(`/class-management/classes?search=${f.prefix}`, f.token.coachA);
    expect(own.body.data.map((c) => c.name)).toEqual([`${f.prefix} A`]);
    expect(own.body.data[0].sessionCount).toBe(2);
  });

  it('M02: coach lọc coach khác => 403; hội viên và lễ tân (không quyền quản lý) => 403', async () => {
    const other = await get(
      `/class-management/classes?coachId=${f.users.coachB.id}`,
      f.token.coachA,
    );
    expect(other.status).toBe(403);
    expect((await get('/class-management/classes', f.token.m1)).status).toBe(403);
    expect((await get('/class-management/classes', f.token.staff)).status).toBe(403);
    expect((await get('/class-management/classes?status=BAD', f.token.admin)).status).toBe(400);
  });

  it('M03: chi tiết lớp có từng buổi, hội viên, booking/cancel; coach thấy thông tin tối thiểu', async () => {
    const detail = await get(`/class-management/classes/${classA.gymClass.id}`, f.token.admin);
    expect(detail.status).toBe(200);
    expect(detail.body.data.sessions).toHaveLength(2);
    const first = detail.body.data.sessions[0];
    expect(first.bookedCount).toBe(2);
    const byStaff = first.enrollments.find((e) => e.member.id === f.users.m2.id);
    expect(byStaff.enrolledBy.id).toBe(f.users.staff.id);
    expect(byStaff.member.email).toBe(f.users.m2.email);
    const cancelled = detail.body.data.sessions[1].enrollments[0];
    expect(cancelled.status).toBe('CANCELLED');

    const asCoach = await get(`/class-management/classes/${classA.gymClass.id}`, f.token.coachA);
    expect(asCoach.body.data.sessions[0].enrollments[0].member.email).toBeUndefined();
  });

  it('M04: coach xem lớp của coach khác => 403; lớp không tồn tại => 404', async () => {
    expect(
      (await get(`/class-management/classes/${classB.gymClass.id}`, f.token.coachA)).status,
    ).toBe(403);
    expect((await get('/class-management/classes/999999999', f.token.admin)).status).toBe(404);
  });
});

describe('UC-CB-12: danh sách học viên của buổi', () => {
  it('R01: coach phụ trách thấy tên và trạng thái, không lộ email/SĐT', async () => {
    const res = await get(
      `/class-management/sessions/${classA.sessions[0].id}/roster`,
      f.token.coachA,
    );
    expect(res.status).toBe(200);
    expect(res.body.data.bookedCount).toBe(2);
    expect(res.body.data.students).toHaveLength(2);
    expect(Object.keys(res.body.data.students[0]).sort()).toEqual(
      ['bookingStatus', 'enrollmentId', 'fullName', 'memberId'].sort(),
    );
    expect(res.body.data.class.coachId).toBeUndefined();
  });

  it('R02: coach khác, hội viên, lễ tân => 403; buổi không tồn tại => 404; quản lý được xem', async () => {
    const path = `/class-management/sessions/${classA.sessions[0].id}/roster`;
    expect((await get(path, f.token.coachB)).status).toBe(403);
    expect((await get(path, f.token.m1)).status).toBe(403);
    expect((await get(path, f.token.staff)).status).toBe(403);
    expect((await get(path, f.token.admin)).status).toBe(200);
    expect((await get('/class-management/sessions/999999999/roster', f.token.admin)).status).toBe(
      404,
    );
  });
});
