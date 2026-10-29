import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../../src/common/errors/api-error.js';
import { Enums, prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { TIME } from '../../../src/constants/index.js';
import { enroll } from '../../../src/modules/class/class-enrollment.service.js';
import * as classService from '../../../src/modules/class/class.service.js';
import { SEED_MOCK_USERS } from './users.mock.js';

const DEMO_CLASSES = [
  {
    name: 'DEMO · Yoga thư giãn',
    subject: 'DEMO · Yoga',
    room: 'DEMO · Studio Yoga',
    teacherEmail: 'coach.yoga@scms.local',
    startTime: '18:00',
    endTime: '19:00',
  },
  {
    name: 'DEMO · Sức mạnh cơ bản',
    subject: 'DEMO · Fitness',
    room: 'DEMO · Phòng Gym',
    teacherEmail: 'coach.gym@scms.local',
    startTime: '07:00',
    endTime: '08:00',
  },
];
const DEMO_DAYS = 21;
const MOCK_ROOM_TYPE = 'Đa năng';

const DEMO_CAPACITY = 15;
const localDate = (date) =>
  new Date(date.getTime() + 7 * TIME.MS_PER_HOUR).toISOString().split('T')[0];

const demoClassPayload = ({ definition, subject, room, teacher }, now) => {
  const startsOn = localDate(new Date(now.getTime() + TIME.MS_PER_DAY));
  return {
    name: definition.name,
    description: 'Lớp mẫu để thử đăng ký toàn lớp và lịch cá nhân.',
    subjectId: subject.id,
    roomId: room.id,
    coachId: teacher.id,
    capacity: Math.min(room.capacity, DEMO_CAPACITY),
    startsOn,
    endsOn: localDate(new Date(now.getTime() + DEMO_DAYS * TIME.MS_PER_DAY)),
    weeklySchedule: [
      {
        dayOfWeek: new Date(startsOn).getUTCDay(),
        startTime: definition.startTime,
        endTime: definition.endTime,
      },
    ],
    registrationStartAt: now.toISOString(),
    registrationEndAt: new Date(`${startsOn}T${definition.startTime}:00+07:00`).toISOString(),
  };
};

async function seedDemoMemberships() {
  const plan = await prisma.membershipPlan.findUnique({ where: { code: 'ACTIVE_90' } });
  if (!plan) return;
  for (const email of ['member1@scms.local', 'member2@scms.local']) {
    const member = await prisma.user.findUnique({ where: { email } });
    if (!member || (await prisma.membership.count({ where: { userId: member.id } }))) continue;
    const now = new Date();
    await prisma.membership.create({
      data: {
        userId: member.id,
        activeUserId: member.id,
        planId: plan.id,
        startDate: now,
        endDate: new Date(now.getTime() + plan.durationDays * TIME.MS_PER_DAY),
      },
    });
  }
}

async function seedDemoClass(definition, actor) {
  const now = new Date();
  const tomorrow = localDate(new Date(now.getTime() + TIME.MS_PER_DAY));
  const dayStart = new Date(`${tomorrow}T00:00:00+07:00`);
  const dayEnd = new Date(dayStart.getTime() + TIME.MS_PER_DAY);
  let gymClass = await prisma.gymClass.findFirst({
    where: {
      name: definition.name,
      sessions: { some: { startAt: { gte: dayStart, lt: dayEnd } } },
    },
  });
  if (gymClass) {
    await enrollMockMembers(gymClass, actor);
    return;
  }
  const teacher = await prisma.user.findFirst({
    where: {
      email: definition.teacherEmail,
      status: Enums.UserStatus.ACTIVE,
      role: { permissions: { some: { permission: { code: P.SCHEDULE_VIEW_TEACHING } } } },
    },
  });
  if (!teacher) return;
  const subject = await prisma.subject.upsert({
    where: { name: definition.subject },
    update: {},
    create: { name: definition.subject, description: 'Dữ liệu mẫu Sprint 2' },
  });
  // Góp ý GV: phòng phải thuộc loại phòng dạy được bộ môn, HLV phải có chuyên môn bộ môn.
  const roomType = await prisma.roomType.upsert({
    where: { name: MOCK_ROOM_TYPE },
    update: {},
    create: { name: MOCK_ROOM_TYPE },
  });
  await prisma.roomTypeSubject.upsert({
    where: { roomTypeId_subjectId: { roomTypeId: roomType.id, subjectId: subject.id } },
    update: {},
    create: { roomTypeId: roomType.id, subjectId: subject.id },
  });
  const room = await prisma.room.upsert({
    where: { name: definition.room },
    update: { roomTypeId: roomType.id },
    create: {
      name: definition.room,
      capacity: DEMO_CAPACITY,
      description: 'Dữ liệu mẫu Sprint 2',
      roomTypeId: roomType.id,
    },
  });
  await prisma.coachSubject.upsert({
    where: { coachId_subjectId: { coachId: teacher.id, subjectId: subject.id } },
    update: {},
    create: { coachId: teacher.id, subjectId: subject.id },
  });
  if (!subject.isActive || !room.isActive) return;
  try {
    gymClass = await classService.create(
      demoClassPayload({ definition, subject, room, teacher }, now),
      actor,
    );
  } catch (error) {
    if (![409, 422].includes(error.statusCode)) throw error;
    logger.warn(
      { className: definition.name, reason: error.message },
      'Bỏ qua lớp demo không còn phù hợp',
    );
    return;
  }
  await enrollMockMembers(gymClass, actor);
}

async function enrollMockMembers(gymClass, actor) {
  const mockEmails = SEED_MOCK_USERS.filter(({ roleCode }) => roleCode === 'MEMBER').map(
    ({ email }) => email,
  );
  const [members, enrolledRows] = await Promise.all([
    prisma.user.findMany({
      where: { email: { in: mockEmails }, status: Enums.UserStatus.ACTIVE },
      select: { id: true, email: true },
      orderBy: { email: 'asc' },
    }),
    prisma.classEnrollment.findMany({
      where: { classId: gymClass.id, status: Enums.EnrollmentStatus.BOOKED },
      select: { memberId: true },
    }),
  ]);
  const enrolled = new Set(enrolledRows.map(({ memberId }) => memberId));
  for (const member of members) {
    if (enrolled.size >= gymClass.capacity) break;
    if (enrolled.has(member.id)) continue;
    try {
      await enroll(gymClass.id, member.id, actor);
      enrolled.add(member.id);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      logger.debug(
        { className: gymClass.name, memberEmail: member.email, reason: error.message },
        'Bỏ qua hội viên không đủ điều kiện vào lớp demo',
      );
    }
  }
  if (enrolled.size < gymClass.capacity) {
    logger.warn(
      { className: gymClass.name, enrolled: enrolled.size, capacity: gymClass.capacity },
      'Lớp mẫu chưa đủ hội viên đăng ký',
    );
  }
}

/** Tạo lớp ngày mai qua service kiểm tra lịch; bổ sung hội viên cho roster lớp demo hiện có. */
export async function seedMockClasses() {
  await seedDemoMemberships();
  const actor = await prisma.user.findUnique({ where: { email: env.SEED_ADMIN_EMAIL } });
  if (!actor) return;
  for (const definition of DEMO_CLASSES) {
    await seedDemoClass(definition, actor);
  }
  logger.info('Seed mock classes xong');
}
