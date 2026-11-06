import { PERMISSIONS as P, SETTING_KEYS as K } from '@scms/shared';
import { prisma, Enums } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { TIME } from '../../../src/constants/index.js';
import { lockSchedule } from '../../../src/common/utils/schedule-transaction.js';
import { getValue } from '../../../src/modules/setting/setting.service.js';
import { loadInvoicePolicy } from '../../../src/modules/payment/invoice-create.service.js';
import { validateResources } from '../../../src/modules/class/class-schedule.service.js';
import { unlock } from '../../../src/modules/attendance/attendance.service.js';
import { councilCalendar } from './calendar.js';
import { createCouncilCatalog } from './catalog.js';
import { createCouncilCourse, populateCouncilCourse, councilClassPayload } from './courses.js';

/** Resolve all calendar/business settings from the current demo environment. */
export const councilContext = async (now = new Date()) => {
  const frames = await prisma.operatingFrame.findMany({
    where: { isActive: true },
    orderBy: { startTime: 'asc' },
  });
  const noticeHours = await getValue(K.CLASS_RESCHEDULE_MIN_HOURS_BEFORE);
  const calendar = councilCalendar(now, frames, noticeHours);
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: env.SEED_ADMIN_EMAIL },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  const permissions = new Set(admin.role.permissions.map((row) => row.permission.code));
  if (![P.CLASS_CREATE, P.ATTENDANCE_MANAGE].every((code) => permissions.has(code)))
    throw new Error('Tài khoản chuẩn bị dữ liệu thiếu quyền tạo lớp/mở điểm danh');
  return {
    now,
    calendar,
    admin,
    permissions,
    noticeHours,
    policy: await loadInvoicePolicy(),
    deadlineDays: await getValue(K.COURSE_SUMMARY_DEADLINE_DAYS),
    ratingDays: await getValue(K.COURSE_RATING_WINDOW_DAYS),
    passPercent: await getValue(K.COURSE_PASS_MIN_ATTENDANCE_PERCENT),
  };
};

/** Add an isolated dataset; do not clear or rewrite any existing business records. */
export const materializeCouncil = async (context) => {
  if (env.NODE_ENV === 'production')
    throw new Error('Bộ dữ liệu hội đồng chỉ dành cho môi trường demo/test');
  const tag = `ccl_${context.now.toISOString().replace(/\D/g, '').slice(0, 17)}`;
  const result = await prisma.$transaction(
    async (db) => {
      await lockSchedule(db);
      const catalog = await createCouncilCatalog(db, tag);
      const actors = [
        catalog.member,
        catalog.otherMember,
        catalog.coach,
        catalog.otherCoach,
        catalog.reception,
      ];
      await db.user.updateMany({
        where: { id: { in: actors.map((u) => u.id) } },
        data: { createdAt: new Date(context.now.getTime() - 30 * TIME.MS_PER_DAY) },
      });
      const courses = {};
      for (const template of context.calendar.courses) {
        const course = await createCouncilCourse(db, { template, catalog, tag, now: context.now });
        await populateCouncilCourse(db, { template, course, catalog }, context);
        const future = course.sessions.filter((s) => s.startAt > context.now);
        if (future.length) await validateResources(db, course, future, course.id);
        courses[template.key] = course;
      }
      return { catalog, courses };
    },
    {
      timeout: 120000,
      maxWait: 30000,
      isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted,
    },
  );
  const session = result.courses.B.sessions[1];
  const unlocked = await unlock(session.id, `Chuẩn bị diễn tập ${tag}; dùng đúng quyền quản lý`, {
    user: context.admin,
    permissions: context.permissions,
  });
  return publicManifest(context, tag, result, unlocked.attendanceUnlockedUntil);
};

const publicManifest = (context, tag, { catalog, courses }, unlockedUntil) => ({
  tag,
  anchor: context.calendar.anchor,
  localDate: context.calendar.localDate,
  timezone: context.calendar.timezone,
  generatedFromSystemClock: true,
  noticeHours: context.noticeHours,
  ratingDays: context.ratingDays,
  accounts: {
    manager: { email: context.admin.email, id: context.admin.id },
    ...Object.fromEntries(
      ['member', 'otherMember', 'coach', 'otherCoach', 'reception'].map((key) => [
        key,
        { email: catalog[key].email, id: catalog[key].id },
      ]),
    ),
  },
  credentials:
    'Demo accounts use SEED_MOCK_PASSWORD from local environment; manager uses its existing credentials. No passwords are exported.',
  resources: { subjectId: catalog.subject.id, roomId: catalog.room.id, coachId: catalog.coach.id },
  createAInWorkflow1: courseAForm(context, tag, catalog),
  courses: Object.fromEntries(Object.entries(courses).map(([key, c]) => [key, courseView(c)])),
  currentSession: {
    id: courses.B.sessions[1].id,
    attendanceUnlockedUntil: unlockedUntil,
    note: 'Management explicitly opened editing for the rehearsal; sessions retain real dates and operating frames.',
  },
  liveActionsNotPerformed: [
    'Create A',
    'Buy A online',
    'Pay invoice I',
    'Transfer whole A enrollment to A2',
    'Record current B attendance/feedback',
    'Publish C',
    'Rate C',
  ],
});

const courseView = (c) => ({
  id: c.id,
  name: c.name,
  price: c.price,
  capacity: c.capacity,
  subjectId: c.subjectId,
  coachId: c.coachId,
  roomId: c.roomId,
  sessions: c.sessions.map((s) => ({
    id: s.id,
    startAt: s.startAt,
    endAt: s.endAt,
    status: s.status,
  })),
});

const courseAForm = (context, tag, catalog) => {
  const template = {
    ...context.calendar.A,
    name: `${tag} · A · Khóa tiếp theo`,
    subjectId: catalog.subject.id,
    roomId: catalog.room.id,
    coachId: catalog.coach.id,
  };
  return { ...template, form: councilClassPayload(template, context.now) };
};
