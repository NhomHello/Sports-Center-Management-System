import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../src/config/db.js';
import { api, apiPath, bearer } from './api.js';
import { createClassFixture, cleanupClassFixture } from './sprint2.js';
const DAY = 86400000;
const FIRST_SESSION_DAYS = 2;
const FIXTURE = Object.freeze({ startDays: 4, registrationDays: 10, enrollmentDays: 5, sessionDays: [FIRST_SESSION_DAYS, 1], hour: 3600000 });

/** Dữ liệu riêng, lớp đã kết thúc; không gọi job/seed phá dữ liệu demo. */
export const createCourseFixture = async () => {
  const f = await createClassFixture();
  f.started = new Date();
  await prisma.rolePermission.createMany({ skipDuplicates: true, data: await Promise.all([
    P.COURSE_SUMMARY_MANAGE_ASSIGNED, P.COACH_PROFILE_READ,
  ].map(async (code) => ({ roleId: f.coach.roleId, permissionId: (await prisma.permission.findUnique({ where: { code } })).id }))) });
  f.item = await prisma.gymClass.create({ data: { name: `${f.prefix} Course`, subjectId: f.subject.id,
    roomId: f.room.id, coachId: f.coach.id, capacity: 5, startsOn: new Date(Date.now() - FIXTURE.startDays * DAY),
    endsOn: new Date(Date.now() - DAY), weeklySchedule: [], registrationStartAt: new Date(Date.now() - FIXTURE.registrationDays * DAY),
    registrationEndAt: new Date(Date.now() - FIXTURE.enrollmentDays * DAY), sessions: { create: FIXTURE.sessionDays.map((days) => ({
      startAt: new Date(Date.now() - days * DAY - FIXTURE.hour), endAt: new Date(Date.now() - days * DAY), coachId: f.coach.id, roomId: f.room.id })) } }, include: { sessions: { orderBy: { endAt: 'asc' } } } });
  await prisma.classEnrollment.createMany({ data: [f.member.id, f.other.id].map((memberId) => ({
    classId: f.item.id, memberId, enrolledBy: f.admin.id, enrolledAt: new Date(Date.now() - FIXTURE.enrollmentDays * DAY) })) });
  f.call = (method, path, body, token = f.coachToken) => api[method](apiPath(path)).set(bearer(token)).send(body);
  return f;
};

/** Dọn FK Sprint 4 trước các fixture dùng chung. */
export const cleanupCourseFixture = async (f) => {
  if (!f) return;
  const where = { classId: f.item.id };
  await prisma.courseRating.deleteMany({ where });
  await prisma.courseSummaryItem.deleteMany({ where: { summary: where } });
  await prisma.courseSummary.deleteMany({ where });
  await prisma.attendance.deleteMany({ where: { session: where } });
  await prisma.notification.deleteMany({ where: { userId: { in: f.userIds } } });
  await prisma.auditLog.deleteMany({ where: { createdAt: { gte: f.started }, OR: [{ userId: f.admin.id }, { entity: 'GymClass', entityId: String(f.item.id) }] } });
  await cleanupClassFixture(f);
};
