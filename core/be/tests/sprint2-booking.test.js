import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import {
  DAY,
  HOUR,
  cleanupBookingFixture,
  clearEnrollments,
  createBookingFixture,
  createClass,
} from './helpers/sprint2.js';

let f;
beforeAll(async () => {
  f = await createBookingFixture();
});
afterAll(async () => cleanupBookingFixture(f));
// Mỗi test độc lập: bỏ các đăng ký để không gây trùng giờ chéo giữa các test.
afterEach(() => clearEnrollments(f));

const enrollSelf = (token, sessionId) =>
  api.post(apiPath(`/sessions/${sessionId}/enrollments/me`)).set(bearer(token));
const cancelSelf = (token, sessionId) =>
  api.delete(apiPath(`/sessions/${sessionId}/enrollments/me`)).set(bearer(token));
const enrollFor = (token, sessionId, memberId) =>
  api
    .post(apiPath(`/sessions/${sessionId}/enrollments`))
    .set(bearer(token))
    .send({ memberId });
const cancelFor = (token, sessionId, memberId) =>
  api.delete(apiPath(`/sessions/${sessionId}/enrollments/${memberId}`)).set(bearer(token));
const bookedCount = (sessionId) =>
  prisma.enrollment.count({ where: { sessionId, status: Enums.EnrollmentStatus.BOOKED } });

describe('UC-CB-06: hội viên tự đăng ký', () => {
  it('B01: đăng ký thành công khi có gói, lớp mở, còn chỗ; ghi audit', async () => {
    const { sessions } = await createClass(f, { name: 'B01' });
    const res = await enrollSelf(f.token.m1, sessions[0].id);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      status: 'BOOKED',
      memberId: f.users.m1.id,
      enrolledBy: null,
    });
    expect(await bookedCount(sessions[0].id)).toBe(1);
    const audit = await prisma.auditLog.count({
      where: { userId: f.users.m1.id, entity: 'Enrollment', entityId: String(res.body.data.id) },
    });
    expect(audit).toBe(1);
  });

  it('B02: đăng ký lần hai cùng buổi => 409, không tạo thêm', async () => {
    const { sessions } = await createClass(f, { name: 'B02' });
    await enrollSelf(f.token.m1, sessions[0].id);
    const again = await enrollSelf(f.token.m1, sessions[0].id);
    expect(again.status).toBe(409);
    expect(await bookedCount(sessions[0].id)).toBe(1);
  });

  it('B03: chưa có gói => 422', async () => {
    const { sessions } = await createClass(f, { name: 'B03' });
    const res = await enrollSelf(f.token.m3, sessions[0].id);
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('gói tập');
  });

  it('B04: gói đã hết hạn => 422', async () => {
    const { sessions } = await createClass(f, { name: 'B04' });
    await prisma.membership.updateMany({
      where: { userId: f.users.m2.id },
      data: { endDate: new Date(Date.now() - HOUR) },
    });
    const res = await enrollSelf(f.token.m2, sessions[0].id);
    expect(res.status).toBe(422);
    await prisma.membership.updateMany({
      where: { userId: f.users.m2.id },
      data: { endDate: new Date(Date.now() + 30 * DAY) },
    });
  });

  it('B05: lớp đóng, ngoài thời gian đăng ký hoặc buổi đã qua => 422', async () => {
    const closed = await createClass(f, { name: 'B05a', status: Enums.ClassStatus.CLOSED });
    const early = await createClass(f, { name: 'B05b', window: [DAY, 5 * DAY] });
    const late = await createClass(f, { name: 'B05c', window: [-5 * DAY, -DAY] });
    const past = await createClass(f, { name: 'B05d', sessions: [[-2 * HOUR, HOUR]] });
    for (const { sessions } of [closed, early, late, past]) {
      expect((await enrollSelf(f.token.m1, sessions[0].id)).status).toBe(422);
    }
  });

  it('B06: hai người giành chỗ cuối cùng một lúc => chỉ một người thành công', async () => {
    const { sessions } = await createClass(f, { name: 'B06', capacity: 1 });
    const results = await Promise.all([
      enrollSelf(f.token.m1, sessions[0].id),
      enrollSelf(f.token.m2, sessions[0].id),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await bookedCount(sessions[0].id)).toBe(1);
  });

  it('B07: trùng giờ buổi khác => 409; buổi sát giờ không giao nhau => 201', async () => {
    const a = await createClass(f, { name: 'B07a', sessions: [[4 * DAY, 2 * HOUR]] });
    const overlap = await createClass(f, { name: 'B07b', sessions: [[4 * DAY + HOUR, 2 * HOUR]] });
    const adjacent = await createClass(f, { name: 'B07c', sessions: [[4 * DAY + 2 * HOUR, HOUR]] });
    expect((await enrollSelf(f.token.m1, a.sessions[0].id)).status).toBe(201);
    expect((await enrollSelf(f.token.m1, overlap.sessions[0].id)).status).toBe(409);
    expect((await enrollSelf(f.token.m1, adjacent.sessions[0].id)).status).toBe(201);
  });

  it('B08: coach không có quyền tự đăng ký => 403; buổi không tồn tại => 404', async () => {
    const { sessions } = await createClass(f, { name: 'B08' });
    expect((await enrollSelf(f.token.coachA, sessions[0].id)).status).toBe(403);
    expect((await enrollSelf(f.token.m1, 999999999)).status).toBe(404);
  });
});

describe('UC-CB-07: hội viên tự huỷ (mốc N giờ)', () => {
  it('B09: huỷ khi còn >= 12 giờ thành công, đăng ký lại được', async () => {
    const { sessions } = await createClass(f, { name: 'B09', sessions: [[13 * HOUR, HOUR]] });
    await enrollSelf(f.token.m1, sessions[0].id);
    const res = await cancelSelf(f.token.m1, sessions[0].id);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
    expect(await bookedCount(sessions[0].id)).toBe(0);
    expect((await enrollSelf(f.token.m1, sessions[0].id)).status).toBe(201);
    expect(await prisma.enrollment.count({ where: { sessionId: sessions[0].id } })).toBe(1);
  });

  it('B10: huỷ khi còn < 12 giờ => 422 và giữ nguyên đăng ký', async () => {
    const { sessions } = await createClass(f, { name: 'B10', sessions: [[11 * HOUR, HOUR]] });
    await enrollSelf(f.token.m1, sessions[0].id);
    const res = await cancelSelf(f.token.m1, sessions[0].id);
    expect(res.status).toBe(422);
    expect(await bookedCount(sessions[0].id)).toBe(1);
  });

  it('B11: huỷ khi chưa đăng ký hoặc đã huỷ => 404', async () => {
    const { sessions } = await createClass(f, { name: 'B11' });
    expect((await cancelSelf(f.token.m1, sessions[0].id)).status).toBe(404);
  });
});

describe('UC-CB-09/10: nhân viên làm hộ', () => {
  it('B12: lễ tân đăng ký hộ ghi enrolled_by; hội viên không gọi được route nhân viên', async () => {
    const { sessions } = await createClass(f, { name: 'B12', sessions: [[13 * HOUR, HOUR]] });
    const res = await enrollFor(f.token.staff, sessions[0].id, f.users.m1.id);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ memberId: f.users.m1.id, enrolledBy: f.users.staff.id });
    expect((await enrollFor(f.token.m1, sessions[0].id, f.users.m2.id)).status).toBe(403);
    expect((await enrollFor(f.token.staff, sessions[0].id, f.users.m1.id)).status).toBe(409);
  });

  it('B13: đăng ký hộ áp dụng cùng kiểm tra (không gói => 422, hết chỗ => 409)', async () => {
    const full = await createClass(f, { name: 'B13', capacity: 1 });
    expect((await enrollFor(f.token.staff, full.sessions[0].id, f.users.m3.id)).status).toBe(422);
    await enrollFor(f.token.staff, full.sessions[0].id, f.users.m1.id);
    expect((await enrollFor(f.token.staff, full.sessions[0].id, f.users.m2.id)).status).toBe(409);
    expect((await enrollFor(f.token.staff, full.sessions[0].id, 999999999)).status).toBe(404);
  });

  it('B14: huỷ hộ ghi cancelled_by; nhân viên không được bỏ qua mốc 12 giờ', async () => {
    const ok = await createClass(f, { name: 'B14a', sessions: [[13 * HOUR, HOUR]] });
    await enrollFor(f.token.staff, ok.sessions[0].id, f.users.m1.id);
    const res = await cancelFor(f.token.staff, ok.sessions[0].id, f.users.m1.id);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'CANCELLED', cancelledBy: f.users.staff.id });

    const late = await createClass(f, { name: 'B14b', sessions: [[5 * HOUR, HOUR]] });
    await enrollFor(f.token.staff, late.sessions[0].id, f.users.m2.id);
    expect((await cancelFor(f.token.staff, late.sessions[0].id, f.users.m2.id)).status).toBe(422);
    expect((await cancelFor(f.token.m1, late.sessions[0].id, f.users.m2.id)).status).toBe(403);
  });
});
