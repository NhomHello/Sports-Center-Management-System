import { hashPassword } from '../../../src/common/utils/password.js';
import { prisma, Enums } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import {
  ATTENDEE_COUNT,
  DAY_MS,
  EXISTING_MEMBER_EMAILS,
  HISTORY_MEMBER_NAMES,
} from './history-data.demo.js';

const dateOnly = (date) => date.toISOString().slice(0, 10);
const VIETNAM_OFFSET_HOURS = 7;

function priorWeekday(weekday, weeksAgo, time) {
  const [hour, minute] = time.split(':').map(Number);
  const now = new Date();
  const daysBack = ((now.getUTCDay() - weekday + 7) % 7) + weeksAgo * 7;
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysBack,
      hour - VIETNAM_OFFSET_HOURS,
      minute,
    ),
  );
}

/** Tạo hội viên đăng nhập demo có email xác minh; không sửa các tài khoản sẵn có. */
async function loadDemoActors() {
  const memberRole = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  const members = [];
  for (let index = 0; index < HISTORY_MEMBER_NAMES.length; index += 1) {
    const number = index + 1;
    members.push(
      await prisma.user.upsert({
        where: { email: `history.member${number}@scms.test` },
        update: { fullName: HISTORY_MEMBER_NAMES[index] },
        create: {
          email: `history.member${number}@scms.test`,
          fullName: HISTORY_MEMBER_NAMES[index],
          passwordHash,
          roleId: memberRole.id,
          emailVerifiedAt: new Date(),
        },
      }),
    );
  }
  const existingMembers = await prisma.user.findMany({
    where: {
      email: { in: EXISTING_MEMBER_EMAILS },
      status: Enums.UserStatus.ACTIVE,
      role: { isDefault: true },
    },
    orderBy: { email: 'asc' },
  });
  if (existingMembers.length !== EXISTING_MEMBER_EMAILS.length)
    throw new Error('Không tìm thấy đủ member1–member5 đang hoạt động');
  members.push(...existingMembers);
  return members;
}

/**
 * Load an active coach, subject, and compatible room for a demo class.
 * @param {{coachEmail: string, name: string}} definition
 * @returns {Promise<{coach: object, subject: object, room: object}>}
 */
export async function loadCourseResources(definition) {
  const coach = await prisma.user.findUniqueOrThrow({
    where: { email: definition.coachEmail },
    include: { coachSubjects: { include: { subject: true } }, coachProfile: true },
  });
  const subject = coach.coachSubjects.find((item) => item.subject.isActive)?.subject;
  if (!subject) throw new Error(`HLV ${coach.email} chưa có bộ môn đang hoạt động`);
  let room = await prisma.room.findFirst({
    where: {
      isActive: true,
      roomType: { isActive: true, subjects: { some: { subjectId: subject.id } } },
    },
    orderBy: { id: 'asc' },
  });
  if (!room) throw new Error(`Không có phòng phù hợp cho bộ môn ${subject.name}`);
  if (room.capacity < ATTENDEE_COUNT) {
    room = await prisma.room.update({
      where: { id: room.id },
      data: { capacity: ATTENDEE_COUNT },
    });
  }
  if (!coach.coachProfile)
    await prisma.coachProfile.create({
      data: {
        userId: coach.id,
        bio: `Hồ sơ HLV ${subject.name} dùng cho dữ liệu lịch sử demo.`,
        experienceYears: 3,
      },
    });
  return { coach, subject, room };
}

function makeSessions(definition, { coach, room }) {
  return definition.days
    .flatMap((weekday) =>
      [4, 3, 2, 1].map((weeksAgo) => {
        const startAt = priorWeekday(weekday, weeksAgo, definition.startTime);
        return {
          startAt,
          endAt: new Date(startAt.getTime() + 60 * 60 * 1000),
          status: Enums.SessionStatus.COMPLETED,
          roomId: room.id,
          coachId: coach.id,
          roomName: room.name,
          coachName: coach.fullName,
          description: `Buổi ${definition.name.replace('Lịch sử demo · ', '')}: thực hành kỹ thuật, thể lực và an toàn.`,
        };
      }),
    )
    .sort((a, b) => a.startAt - b.startAt);
}

/**
 * Tạo lớp lịch sử có 8 buổi quá khứ và đăng ký hội viên demo.
 * @param {object} definition
 * @param {object[]} members
 */
export async function ensureCourse(definition, members) {
  const resources = await loadCourseResources(definition);
  const sessions = makeSessions(definition, resources);
  const first = sessions[0];
  const last = sessions.at(-1);
  let gymClass = await prisma.gymClass.findFirst({ where: { name: definition.name } });
  if (!gymClass) {
    gymClass = await prisma.gymClass.create({
      data: {
        name: definition.name,
        description: `Khóa học lịch sử demo gồm 8 buổi, có điểm danh và đánh giá mẫu. HLV: ${resources.coach.fullName}.`,
        subjectId: resources.subject.id,
        roomId: resources.room.id,
        coachId: resources.coach.id,
        capacity: ATTENDEE_COUNT,
        price: 0,
        startsOn: new Date(dateOnly(first.startAt)),
        endsOn: new Date(dateOnly(last.startAt)),
        weeklySchedule: definition.days.map((dayOfWeek) => ({
          dayOfWeek,
          startTime: definition.startTime,
          endTime: definition.endTime,
        })),
        registrationStartAt: new Date(first.startAt.getTime() - 30 * DAY_MS),
        registrationEndAt: new Date(first.startAt.getTime() - DAY_MS),
        status: Enums.ClassStatus.OPEN,
        sessions: { create: sessions },
      },
    });
  } else {
    gymClass = await prisma.gymClass.update({
      where: { id: gymClass.id },
      data: { capacity: ATTENDEE_COUNT },
    });
  }
  const storedSessions = await prisma.classSession.findMany({
    where: { classId: gymClass.id },
    orderBy: { startAt: 'asc' },
  });
  if (storedSessions.length !== 8)
    throw new Error(`${definition.name} cần đúng 8 buổi; hiện có ${storedSessions.length}`);
  for (const member of members) {
    await prisma.classEnrollment.upsert({
      where: { classId_memberId: { classId: gymClass.id, memberId: member.id } },
      update: { status: Enums.EnrollmentStatus.BOOKED },
      create: {
        classId: gymClass.id,
        memberId: member.id,
        enrolledBy: resources.coach.id,
        enrolledAt: new Date(first.startAt.getTime() - 30 * DAY_MS),
      },
    });
  }
  return { gymClass, sessions: storedSessions, members, coach: resources.coach, definition };
}

export { loadDemoActors };
