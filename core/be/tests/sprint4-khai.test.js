import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer, loginAs } from './helpers/api.js';
import { createCourseFixture, cleanupCourseFixture } from './helpers/sprint4.js';
import { runCourseCompletion } from '../src/modules/course-summary/course-completion.job.js';
let f;
let viewerToken;
const get = (path, token) => api.get(apiPath(path)).set(bearer(token));
beforeAll(async () => {
  f = await createCourseFixture();
  await runCourseCompletion(new Date(), f.item.id);
  const role = await prisma.role.create({
    data: {
      code: `${f.prefix}_REPORT`,
      name: 'TEST course-only viewer',
      permissions: { create: { permission: { connect: { code: P.COURSE_SUMMARY_VIEW_ALL } } } },
    },
  });
  f.roleIds.push(role.id);
  const user = await prisma.user.create({
    data: {
      email: `${f.prefix}_report@scms.test`,
      fullName: 'TEST course-only viewer',
      roleId: role.id,
      passwordHash: f.member.passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  f.userIds.push(user.id);
  viewerToken = await loginAs(user.email, f.password);
});
afterAll(async () => cleanupCourseFixture(f));
describe('Sprint 4 Khải: scoped UI contracts', () => {
  it('TC-S4-KHAI-API-01: lists only the assigned author with server pagination', async () => {
    const own = await get('/course-summaries', f.coachToken).query({ q: f.prefix, pageSize: 1 });
    expect(own.status).toBe(200);
    expect(own.body.meta.total).toBe(1);
    expect(own.body.data[0].classId).toBe(f.item.id);
    const other = await get('/course-summaries', f.coachOtherToken).query({ q: f.prefix });
    expect(other.body.data).toEqual([]);
    expect((await get('/course-summaries', f.memberToken)).status).toBe(403);
    expect((await api.get(apiPath('/course-summaries'))).status).toBe(401);
  });
  it('TC-S4-KHAI-API-02: course-only viewer can read summaries and filter choices without report.view', async () => {
    expect((await get(`/classes/${f.item.id}/summary`, viewerToken)).status).toBe(200);
    const options = await get('/reports/course-summaries/filters', viewerToken);
    expect(options.status).toBe(200);
    expect(options.body.data.subjects.some((r) => r.id === f.subject.id)).toBe(true);
    expect((await get('/reports/dashboard', viewerToken)).status).toBe(403);
    expect((await get('/reports/course-summaries/filters', f.coachToken)).status).toBe(403);
  });
  it('TC-S4-KHAI-API-03: rating context belongs to token and returns server deadline', async () => {
    const res = await get(`/classes/${f.item.id}/ratings/me`, f.memberToken);
    expect(res.status).toBe(200);
    expect(res.body.data.canRate).toBe(true);
    expect(res.body.data.rating).toBeNull();
    expect(res.body.data.deadlineAt).toBeTruthy();
    expect((await get(`/classes/${f.item.id}/ratings/me`, f.coachToken)).status).toBe(403);
    expect((await get('/classes/99999999/ratings/me', f.memberToken)).status).toBe(403);
  });
  it('TC-S4-KHAI-API-04: reads own existing rating and expires editing without discarding history', async () => {
    const data = { courseStars: 5, coachStars: 4, comment: 'TEST feedback' };
    expect(
      (await f.call('post', `/classes/${f.item.id}/ratings`, data, f.memberToken)).status,
    ).toBe(201);
    expect(
      (await get(`/classes/${f.item.id}/ratings/me`, f.otherToken)).body.data.rating,
    ).toBeNull();
    await prisma.classSession.updateMany({
      where: { classId: f.item.id },
      data: {
        startAt: new Date(Date.now() - 16 * 86400000),
        endAt: new Date(Date.now() - 15 * 86400000),
      },
    });
    const res = await get(`/classes/${f.item.id}/ratings/me`, f.memberToken);
    expect(res.body.data.canRate).toBe(false);
    expect(res.body.data.rating.comment).toBe(data.comment);
    expect((await f.call('put', `/classes/${f.item.id}/ratings`, data, f.memberToken)).status).toBe(
      422,
    );
  });
  it('TC-S4-KHAI-API-05: moderator directory is denied to ordinary coaches', async () => {
    expect((await get('/course-ratings/coaches', f.coachToken)).status).toBe(403);
    const res = await get('/course-ratings/coaches', f.adminToken);
    expect(res.status).toBe(200);
    expect(res.body.data.find((r) => r.id === f.coach.id)).toEqual({
      id: f.coach.id,
      fullName: f.coach.fullName,
    });
  });
  it('TC-S4-KHAI-API-06: published summary keeps its snapshot until reopened', async () => {
    const scenario = await createCourseFixture();
    try {
      await runCourseCompletion(new Date(), scenario.item.id);
      const base = `/classes/${scenario.item.id}/summary`;
      const initial = (await scenario.call('get', base)).body.data;
      for (const item of initial.items)
        await scenario.call('put', `${base}/items/${item.id}`, {
          result: 'NOT_PASSED',
          progress: 3,
        });
      expect(
        (await scenario.call('post', `${base}/publish`, { acknowledgeMissingAttendance: true }))
          .status,
      ).toBe(200);
      await prisma.attendance.createMany({
        data: scenario.item.sessions.map((session) => ({
          sessionId: session.id,
          memberId: scenario.member.id,
          actorId: scenario.coach.id,
          status: 'PRESENT',
        })),
      });
      const published = (await scenario.call('get', base)).body.data;
      expect(
        published.items.find((item) => item.memberId === scenario.member.id).attendance.percent,
      ).toBe(0);
      await scenario.call(
        'post',
        `${base}/reopen`,
        { reason: 'Cập nhật lại điểm danh' },
        scenario.adminToken,
      );
      const reopened = (await scenario.call('get', base)).body.data;
      expect(
        reopened.items.find((item) => item.memberId === scenario.member.id).attendance.percent,
      ).toBe(100);
    } finally {
      await cleanupCourseFixture(scenario);
    }
  });
});
