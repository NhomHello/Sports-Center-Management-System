import { randomUUID } from 'node:crypto';
import { PERMISSIONS } from '@scms/shared';
import { hashPassword } from '../../src/common/utils/password.js';
import { Enums, prisma } from '../../src/config/db.js';
import { TIME } from '../../src/constants/index.js';
import { loginAs, loginAsAdmin } from './api.js';

export const PASSWORD = 'Sprint2@Test123';
export const HOUR = TIME.MS_PER_HOUR;
export const DAY = TIME.MS_PER_DAY;

/** Mốc thời gian tương đối so với lúc chạy test (ms). */
export const inFuture = (ms) => new Date(Date.now() + ms);

/**
 * Fixture Sprint 2: coach A/B, lễ tân, 3 hội viên (có gói), bộ môn, phòng. Mọi bản ghi có tiền tố
 * riêng để dọn đúng phần của suite, không đụng dữ liệu seed.
 */
export const createBookingFixture = async () => {
  const prefix = `TEST_S2_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const passwordHash = await hashPassword(PASSWORD);
  // Tìm role theo quyền (không hardcode tên role): coach xem lịch dạy, lễ tân đăng ký hộ.
  const roleWith = (grant) =>
    prisma.role.findFirstOrThrow({
      where: {
        permissions: { some: { permission: { code: grant } } },
        NOT: { permissions: { some: { permission: { code: PERMISSIONS.CLASS_READ_ALL } } } },
      },
      orderBy: { id: 'asc' },
    });
  const coachRole = await roleWith(PERMISSIONS.SCHEDULE_VIEW_TEACHING);
  const receptionRole = await roleWith(PERMISSIONS.CLASS_ENROLL_FOR_MEMBER);
  const memberRole = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
  const makeUser = (label, roleId) =>
    prisma.user.create({
      data: {
        email: `${prefix}_${label}@scms.test`,
        fullName: `${prefix} ${label}`,
        roleId,
        passwordHash,
      },
    });

  const [coachA, coachB, staff, m1, m2, m3] = await Promise.all([
    makeUser('coachA', coachRole.id),
    makeUser('coachB', coachRole.id),
    makeUser('staff', receptionRole.id),
    makeUser('m1', memberRole.id),
    makeUser('m2', memberRole.id),
    makeUser('m3', memberRole.id),
  ]);
  const plan = await prisma.membershipPlan.create({
    data: { code: `${prefix}_PLAN`, name: `${prefix} Plan`, price: 100000, durationDays: 30 },
  });
  // m1, m2 có gói còn hạn; m3 chưa từng mua gói
  await prisma.membership.createMany({
    data: [m1, m2].map((member) => ({
      userId: member.id,
      planId: plan.id,
      startDate: inFuture(-DAY),
      endDate: inFuture(30 * DAY),
    })),
  });
  const subject = await prisma.subject.create({ data: { name: `${prefix} Subject` } });
  const room = await prisma.room.create({ data: { name: `${prefix} Room`, capacity: 20 } });

  const fixture = {
    prefix,
    users: { coachA, coachB, staff, m1, m2, m3 },
    userIds: [coachA, coachB, staff, m1, m2, m3].map((user) => user.id),
    plan,
    subject,
    room,
    token: {},
  };
  const logins = { coachA, coachB, staff, m1, m2, m3 };
  await Promise.all(
    Object.entries(logins).map(async ([key, user]) => {
      fixture.token[key] = await loginAs(user.email, PASSWORD);
    }),
  );
  fixture.token.admin = await loginAsAdmin();
  return fixture;
};

/**
 * Tạo lớp kèm các buổi. `sessions` là danh sách [offsetBắtĐầuMs, độDàiMs] so với hiện tại.
 * @returns {Promise<{ gymClass: object, sessions: object[] }>}
 */
export const createClass = async (fixture, options = {}) => {
  const {
    name = 'Lop',
    coach = fixture.users.coachA,
    capacity = 5,
    status = Enums.ClassStatus.OPEN,
    window = [-DAY, 10 * DAY],
    sessions = [[3 * DAY, HOUR]],
  } = options;
  const gymClass = await prisma.gymClass.create({
    data: {
      name: `${fixture.prefix} ${name}`,
      subjectId: fixture.subject.id,
      roomId: fixture.room.id,
      coachId: coach.id,
      capacity,
      status,
      startsOn: inFuture(0),
      endsOn: inFuture(30 * DAY),
      weeklySchedule: [],
      registrationStartAt: inFuture(window[0]),
      registrationEndAt: inFuture(window[1]),
    },
  });
  const created = [];
  for (const [offset, length] of sessions) {
    created.push(
      await prisma.classSession.create({
        data: { classId: gymClass.id, startAt: inFuture(offset), endAt: inFuture(offset + length) },
      }),
    );
  }
  return { gymClass, sessions: created };
};

/** Xoá đăng ký của các lớp trong fixture (giữ lớp, buổi, hội viên). */
export const clearEnrollments = (fixture) =>
  prisma.enrollment.deleteMany({
    where: { session: { gymClass: { name: { startsWith: fixture.prefix } } } },
  });

export const cleanupBookingFixture = async (fixture) => {
  if (!fixture) return;
  const classes = { name: { startsWith: fixture.prefix } };
  await prisma.enrollment.deleteMany({ where: { session: { gymClass: classes } } });
  await prisma.classSession.deleteMany({ where: { gymClass: classes } });
  await prisma.gymClass.deleteMany({ where: classes });
  await prisma.subject.deleteMany({ where: { name: { startsWith: fixture.prefix } } });
  await prisma.room.deleteMany({ where: { name: { startsWith: fixture.prefix } } });
  await prisma.membership.deleteMany({ where: { userId: { in: fixture.userIds } } });
  await prisma.membershipPlan.deleteMany({ where: { code: { startsWith: fixture.prefix } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: fixture.userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: fixture.userIds } } });
};
