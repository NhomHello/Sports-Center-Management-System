import { randomUUID } from 'node:crypto';
import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { hashPassword } from '../../src/common/utils/password.js';
import { createSprintFixture, cleanupSprintFixture } from './sprint1.js';

async function attachCoachTokens(f, withApi) {
  if (!withApi) return;
  const { loginAs } = await import('./api.js');
  f.coachToken = await loginAs(f.coach.email, f.password);
  f.coachOtherToken = await loginAs(f.coachOther.email, f.password);
}

const DAY_MS = 86400000;
const FIXTURE_DAYS = Object.freeze({ membership: 90, start: 14, end: 35, registrationEnd: 10 });

/** Fixture Flow 2 riêng từng suite, không sửa dữ liệu demo/quyền hệ thống. */
export const createClassFixture = async ({ withApi = true } = {}) => {
  const f = await createSprintFixture({ withApi });
  f.admin = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  const role = await prisma.role.create({
    data: {
      code: `TEST_S2_${randomUUID()}`,
      name: `${f.prefix} Teaching`,
      permissions: {
        create: await Promise.all(
          [P.CLASS_READ, P.CLASS_VIEW_ROSTER, P.SCHEDULE_VIEW_TEACHING].map(async (code) => ({
            permission: { connect: { code } },
          })),
        ),
      },
    },
  });
  f.roleIds.push(role.id);
  const passwordHash = await hashPassword(f.password);
  f.coach = await prisma.user.create({
    data: {
      email: `${f.prefix}_t@scms.test`,
      fullName: `${f.prefix} Teacher`,
      roleId: role.id,
      passwordHash,
    },
  });
  f.coachOther = await prisma.user.create({
    data: {
      email: `${f.prefix}_u@scms.test`,
      fullName: `${f.prefix} Teacher Other`,
      roleId: role.id,
      passwordHash,
    },
  });
  f.userIds.push(f.coach.id, f.coachOther.id);
  await attachCoachTokens(f, withApi);
  f.subject = await prisma.subject.create({ data: { name: `${f.prefix} Subject` } });
  f.room = await prisma.room.create({ data: { name: `${f.prefix} Room`, capacity: 10 } });
  f.roomOther = await prisma.room.create({
    data: { name: `${f.prefix} Other Room`, capacity: 10 },
  });
  f.plan = await prisma.membershipPlan.create({
    data: { code: f.prefix, name: `${f.prefix} Plan`, price: 100, durationDays: 90 },
  });
  for (const memberId of [f.member.id, f.other.id]) {
    await prisma.membership.create({
      data: {
        userId: memberId,
        activeUserId: memberId,
        planId: f.plan.id,
        startDate: new Date(Date.now() - DAY_MS),
        endDate: new Date(Date.now() + FIXTURE_DAYS.membership * DAY_MS),
      },
    });
  }
  return f;
};

/** Lịch tương lai tương đối giúp test chạy lại ở mọi ngày. */
export const classPayload = (f, overrides = {}) => {
  const startsOn = new Date(Date.now() + FIXTURE_DAYS.start * DAY_MS).toISOString().split('T')[0];
  return {
    name: `${f.prefix} Class`,
    subjectId: f.subject.id,
    roomId: f.room.id,
    coachId: f.coach.id,
    capacity: 2,
    startsOn,
    endsOn: new Date(Date.now() + FIXTURE_DAYS.end * DAY_MS).toISOString().split('T')[0],
    weeklySchedule: [
      { dayOfWeek: new Date(startsOn).getUTCDay(), startTime: '18:00', endTime: '19:00' },
    ],
    registrationStartAt: new Date(Date.now() - DAY_MS).toISOString(),
    registrationEndAt: new Date(Date.now() + FIXTURE_DAYS.registrationEnd * DAY_MS).toISOString(),
    ...overrides,
  };
};

/** Dọn đúng phạm vi fixture, bao gồm outbox và FK mới trước khi dọn user. */
export const cleanupClassFixture = async (f) => {
  if (!f) return;
  const classes = await prisma.gymClass.findMany({ where: { subjectId: f.subject.id } });
  const ids = classes.map((c) => c.id);
  const classWhere = { classId: { in: ids } };
  const enrollmentRows = await prisma.classEnrollment.findMany({
    where: classWhere,
    select: { id: true },
  });
  await prisma.classEvent.deleteMany({ where: classWhere });
  await prisma.classEnrollment.deleteMany({ where: classWhere });
  await prisma.classSession.deleteMany({ where: classWhere });
  await prisma.gymClass.deleteMany({ where: { id: { in: ids } } });
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entity: 'GymClass', entityId: { in: ids.map(String) } },
        { entity: 'ClassEnrollment', entityId: { in: enrollmentRows.map((e) => String(e.id)) } },
      ],
    },
  });
  await prisma.room.deleteMany({ where: { id: { in: [f.room.id, f.roomOther.id] } } });
  await prisma.subject.delete({ where: { id: f.subject.id } });
  await cleanupSprintFixture(f);
};
