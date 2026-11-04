import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { signAccessToken } from '../src/common/utils/jwt.js';
import { api, apiPath } from './helpers/api.js';
import { createCancellationHistoryFixture } from './helpers/cancellation-history.js';
import { cleanupGopyFixture, createPaidClass } from './helpers/gopy.js';
let f;
let item;
let outsiderToken;
let unrelated;
beforeAll(async () => {
  ({ f, item } = await createCancellationHistoryFixture());
  const outsider = await prisma.user.create({
    data: {
      email: `${f.prefix}_journal@scms.test`,
      fullName: 'Hội viên không thuộc khóa',
      roleId: f.member.roleId,
      passwordHash: f.member.passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  f.userIds.push(outsider.id);
  outsiderToken = signAccessToken({ sub: outsider.id, version: outsider.tokenVersion });
  unrelated = await createPaidClass(f, { roomId: f.roomOther.id, coachId: f.coachOther.id });
  await prisma.attendance.create({
    data: {
      sessionId: item.sessions[0].id,
      memberId: f.other.id,
      actorId: f.coach.id,
      status: 'ABSENT',
    },
  });
  await prisma.sessionFeedback.create({
    data: {
      sessionId: item.sessions[0].id,
      memberId: f.other.id,
      authorId: f.coach.id,
      rating: 2,
      note: 'Ghi chú riêng của hội viên khác',
    },
  });
});
afterAll(async () => cleanupGopyFixture(f));
const journal = () => f.call('get', `/attendance/courses/${item.id}`, undefined, f.memberToken);

describe('TC-COURSE-HISTORY: một khóa, đủ buổi, đúng điểm danh và nhận xét của một hội viên', () => {
  it('TC-COURSE-HISTORY-01: chỉ chọn khóa thuộc lịch sử của mình, không trộn toàn bộ lớp đang mở', async () => {
    const result = await f.call('get', '/attendance/courses', undefined, f.memberToken);
    expect(result.status).toBe(200);
    expect(result.body.data.map((row) => row.id)).toContain(item.id);
    expect(result.body.data.map((row) => row.id)).not.toContain(unrelated.id);
    expect(
      (await f.call('get', `/attendance/courses/${unrelated.id}`, undefined, f.memberToken)).status,
    ).toBe(404);
  });
  it('TC-COURSE-HISTORY-02: trả đủ 20 buổi theo thời gian, bao gồm chưa điểm danh/chưa có note', async () => {
    const result = await journal();
    expect(result.status).toBe(200);
    const data = result.body.data;
    expect(data.sessions).toHaveLength(20);
    expect(data.sessions.map((s) => s.number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    const ordered = data.sessions.map((s) => s.startAt);
    expect(ordered).toEqual([...ordered].sort());
    expect(data.sessions.filter((s) => s.attendance === null)).toHaveLength(19);
    expect(data.sessions.filter((s) => s.feedback === null)).toHaveLength(19);
    expect(data.sessions.at(-1).coach.id).toBe(f.coachOther.id);
  });
  it('TC-COURSE-HISTORY-03: ghép theo đúng sessionId và memberId, không lộ ghi chú hoặc điểm của người khác', async () => {
    const result = await journal();
    const session = result.body.data.sessions.find((s) => s.id === item.sessions[0].id);
    expect(session.attendance.status).toBe('PRESENT');
    expect(session.feedback).toMatchObject({ rating: 4, note: 'Nhận xét phải được giữ sau hủy' });
    expect(JSON.stringify(result.body.data)).not.toContain('Ghi chú riêng của hội viên khác');
  });
  it('TC-COURSE-HISTORY-04: không có JWT, chèn memberId hoặc đoán khóa người khác đều bị chặn', async () => {
    expect((await api.get(apiPath('/attendance/courses'))).status).toBe(401);
    expect(
      (await f.call('get', `/attendance/courses?memberId=${f.other.id}`, undefined, f.memberToken))
        .status,
    ).toBe(400);
    expect(
      (
        await f.call(
          'get',
          `/attendance/courses/${item.id}?memberId=${f.other.id}`,
          undefined,
          f.memberToken,
        )
      ).status,
    ).toBe(400);
    expect(
      (await f.call('get', `/attendance/courses/${item.id}`, undefined, outsiderToken)).status,
    ).toBe(404);
    expect(
      (await f.call('get', `/members/${f.member.id}/course-history`, undefined, f.otherToken))
        .status,
    ).toBe(403);
  });
  it('TC-COURSE-HISTORY-05: admin xem được một hội viên, vẫn không trộn nhận xét hai hội viên cùng lớp', async () => {
    const list = await f.call('get', `/members/${f.other.id}/course-history`);
    expect(list.status).toBe(200);
    const detail = await f.call('get', `/members/${f.other.id}/course-history/${item.id}`);
    expect(detail.status).toBe(200);
    const session = detail.body.data.sessions.find((s) => s.id === item.sessions[0].id);
    expect(session.feedback.note).toBe('Ghi chú riêng của hội viên khác');
    expect(session.attendance.status).toBe('ABSENT');
    expect(JSON.stringify(detail.body.data)).not.toContain('Nhận xét phải được giữ sau hủy');
  });
  it('TC-COURSE-HISTORY-06: sau hủy và đăng ký lại vẫn đủ buổi và giữ được điểm/nhận xét lịch sử', async () => {
    const enrollment = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: item.id, memberId: f.member.id } },
    });
    expect(
      (
        await f.call(
          'post',
          `/enrollments/${enrollment.id}/cancel`,
          { settlement: 'REFUND', reason: 'Kiểm tra lịch sử khóa học' },
          f.memberToken,
        )
      ).status,
    ).toBe(200);
    const cancelled = await journal();
    expect(cancelled.body.data.course.enrollmentStatus).toBe('CANCELLED');
    expect(cancelled.body.data.sessions.at(-1).inEnrollmentPeriod).toBe(false);
    await f.call('delete', `/classes/${item.id}/waitlist/me`, {}, f.otherToken);
    const rebuy = await f.call('post', `/classes/${item.id}/orders`, {}, f.memberToken);
    expect(rebuy.status).toBe(201);
    const history = await journal();
    expect(history.body.data.sessions).toHaveLength(20);
    const past = history.body.data.sessions.find((s) => s.id === item.sessions[0].id);
    expect(past.attendance.status).toBe('PRESENT');
    expect(past.feedback.rating).toBe(4);
    expect(past.inEnrollmentPeriod).toBe(true);
    expect(history.body.data.sessions.at(-1).inEnrollmentPeriod).toBe(false);
  });
});
