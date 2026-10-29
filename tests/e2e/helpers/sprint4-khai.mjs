import { expect } from '@playwright/test';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../../core/be/src/config/db.js';
import {
  createCourseFixture,
  cleanupCourseFixture,
} from '../../../core/be/tests/helpers/sprint4.js';
import { runCourseCompletion } from '../../../core/be/src/modules/course-summary/course-completion.job.js';
import { loginAs } from '../../../core/be/tests/helpers/api.js';

export async function createFixture() {
  const f = await createCourseFixture();
  await prisma.attendance.createMany({
    data: [
      {
        sessionId: f.item.sessions[0].id,
        memberId: f.member.id,
        actorId: f.coach.id,
        status: 'PRESENT',
      },
      {
        sessionId: f.item.sessions[1].id,
        memberId: f.member.id,
        actorId: f.coach.id,
        status: 'EXCUSED',
      },
    ],
  });
  await runCourseCompletion(new Date(), f.item.id);
  f.summary = (await f.call('get', `/classes/${f.item.id}/summary`)).body.data;
  return f;
}
export const cleanup = cleanupCourseFixture;
export async function fillDraft(f) {
  for (const item of f.summary.items) {
    const res = await f.call('put', `/classes/${f.item.id}/summary/items/${item.id}`, {
      result: item.suggestedResult,
      progress: 4,
      comment: 'Nhận xét kiểm thử',
      nextCourse: 'Fitness nâng cao',
    });
    expect(res.status).toBe(200);
  }
}
export async function publish(f) {
  await fillDraft(f);
  expect(
    (
      await f.call('post', `/classes/${f.item.id}/summary/publish`, {
        acknowledgeMissingAttendance: true,
      })
    ).status,
  ).toBe(200);
}
export async function signIn(page, token, path) {
  await page.addInitScript(
    (accessToken) =>
      localStorage.setItem('scms.auth', JSON.stringify({ state: { accessToken }, version: 0 })),
    token,
  );
  await page.goto(path);
}
export async function newPage(browser, token, path) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, token, path);
  return page;
}
export async function openResults(page, f) {
  await signIn(page, f.memberToken, '/profile');
  await page.getByRole('tab', { name: 'Khóa học đã hoàn thành', exact: true }).click();
  await expect(page.locator('.ant-table-row').filter({ hasText: f.item.name })).toBeVisible();
}
export async function viewerToken(f) {
  const role = await prisma.role.create({
    data: {
      code: `${f.prefix}_V`,
      name: 'TEST course viewer',
      permissions: { create: { permission: { connect: { code: P.COURSE_SUMMARY_VIEW_ALL } } } },
    },
  });
  f.roleIds.push(role.id);
  const user = await prisma.user.create({
    data: {
      email: `${f.prefix}_viewer@scms.test`,
      fullName: 'TEST Course Viewer',
      roleId: role.id,
      passwordHash: f.member.passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  f.userIds.push(user.id);
  return loginAs(user.email, f.password);
}
