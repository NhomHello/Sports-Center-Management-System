import { PERMISSIONS as P } from '@scms/shared';
import { Enums, prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { TIME } from '../../../src/constants/index.js';
import * as classService from '../../../src/modules/class/class.service.js';

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
    startTime: '19:00',
    endTime: '20:00',
  },
];
const DEMO_DAYS = 21;
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
  const existing = await prisma.gymClass.findFirst({
    where: {
      name: definition.name,
      endsOn: { gte: new Date(localDate(now)) },
    },
  });
  if (existing) return;
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
  const room = await prisma.room.upsert({
    where: { name: definition.room },
    update: {},
    create: { name: definition.room, capacity: DEMO_CAPACITY, description: 'Dữ liệu mẫu Sprint 2' },
  });
  if (!subject.isActive || !room.isActive) return;
  try {
    await classService.create(demoClassPayload({ definition, subject, room, teacher }, now), actor);
  } catch (error) {
    if (![409, 422].includes(error.statusCode)) throw error;
    logger.warn(
      { className: definition.name, reason: error.message },
      'Bỏ qua lớp demo không còn phù hợp',
    );
  }
}

/** Chỉ chạy với SEED_MOCK_DATA; không gia hạn gói cũ hoặc ghi đè lớp đã chỉnh sửa. */
export async function seedMockClasses() {
  await seedDemoMemberships();
  const actor = await prisma.user.findUnique({ where: { email: env.SEED_ADMIN_EMAIL } });
  if (!actor) return;
  for (const definition of DEMO_CLASSES) await seedDemoClass(definition, actor);
  logger.info('Seed mock classes xong');
}
