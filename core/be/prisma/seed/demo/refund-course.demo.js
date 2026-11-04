import { hashPassword } from '../../../src/common/utils/password.js';
import { prisma, Enums } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { TIME } from '../../../src/constants/index.js';
import * as classService from '../../../src/modules/class/class.service.js';
import { buyCourseAtCounter, backdateInvoice } from './payments.demo.js';
import { loadCourseResources } from './history-courses.demo.js';

const COURSE_NAME = 'Demo hoàn tiền 10/20 buổi - 1.000.000đ';
const MEMBER_EMAIL = 'refund.test@scms.test';
const TOTAL_SESSIONS = 20;
const COMPLETED_SESSIONS = 10;
const COURSE_PRICE = 1_000_000;
const PURCHASE_AGE_DAYS = 60;
const MONDAY = 1;
const WEDNESDAY = 3;
const SESSION_DAYS = [MONDAY, WEDNESDAY];
const SESSION_START = '10:00';
const SESSION_END = '11:00';

const asDateOnly = (date) => new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);

const nextMonday = () => {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysUntilMonday = (8 - monday.getUTCDay()) % 7 || 7;
  monday.setUTCDate(monday.getUTCDate() + daysUntilMonday);
  return monday;
};

const recentSessionStarts = () => {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const starts = [];
  for (let daysAgo = 1; starts.length < COMPLETED_SESSIONS; daysAgo += 1) {
    const date = new Date(today.getTime() - daysAgo * TIME.MS_PER_DAY);
    if (!SESSION_DAYS.includes(date.getUTCDay())) continue;
    starts.push(new Date(`${date.toISOString().slice(0, 10)}T${SESSION_START}:00+07:00`));
  }
  return starts.reverse();
};

const loadRefundMember = async () => {
  const role = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  return prisma.user.upsert({
    where: { email: MEMBER_EMAIL },
    update: { fullName: 'Hội viên test hoàn tiền' },
    create: {
      email: MEMBER_EMAIL,
      fullName: 'Hội viên test hoàn tiền',
      passwordHash,
      roleId: role.id,
      emailVerifiedAt: new Date(),
    },
  });
};

const createRefundClass = async (resources, staff) => {
  const startsOn = nextMonday();
  const endsOn = new Date(startsOn.getTime() + (10 * 7 - 1) * TIME.MS_PER_DAY);
  return classService.create(
    {
      name: COURSE_NAME,
      description: 'Khóa kiểm thử hoàn tiền: đã học 10/20 buổi, mỗi buổi có điểm danh.',
      subjectId: resources.subject.id,
      roomId: resources.room.id,
      coachId: resources.coach.id,
      capacity: 1,
      price: COURSE_PRICE,
      startsOn: startsOn.toISOString().slice(0, 10),
      endsOn: endsOn.toISOString().slice(0, 10),
      weeklySchedule: SESSION_DAYS.map((dayOfWeek) => ({
        dayOfWeek,
        startTime: SESSION_START,
        endTime: SESSION_END,
      })),
      registrationStartAt: new Date(Date.now() - TIME.MS_PER_DAY).toISOString(),
      registrationEndAt: new Date(startsOn.getTime() - TIME.MS_PER_DAY).toISOString(),
      status: Enums.ClassStatus.OPEN,
    },
    staff,
  );
};

const recordCompletedSessions = async (gymClass, member, coach, invoice) => {
  const pastStarts = recentSessionStarts();
  const courseSessions = gymClass.sessions;
  if (courseSessions.length !== TOTAL_SESSIONS)
    throw new Error(`Lớp kiểm thử cần đúng ${TOTAL_SESSIONS} buổi`);
  for (const [index, session] of courseSessions.slice(0, COMPLETED_SESSIONS).entries()) {
    const startAt = pastStarts[index];
    await prisma.classSession.update({
      where: { id: session.id },
      data: {
        startAt,
        endAt: new Date(startAt.getTime() + TIME.MS_PER_HOUR),
        status: Enums.SessionStatus.COMPLETED,
      },
    });
    await prisma.attendance.upsert({
      where: { sessionId_memberId: { sessionId: session.id, memberId: member.id } },
      update: { status: Enums.AttendanceStatus.PRESENT, actorId: coach.id },
      create: {
        sessionId: session.id,
        memberId: member.id,
        actorId: coach.id,
        status: Enums.AttendanceStatus.PRESENT,
      },
    });
  }

  const latest = courseSessions.at(-1);
  await prisma.gymClass.update({
    where: { id: gymClass.id },
    data: {
      startsOn: asDateOnly(pastStarts[0]),
      endsOn: asDateOnly(latest.startAt),
    },
  });
  await prisma.classEnrollment.update({
    where: { classId_memberId: { classId: gymClass.id, memberId: member.id } },
    data: { enrolledAt: new Date(pastStarts[0].getTime() - TIME.MS_PER_DAY) },
  });
  await backdateInvoice(invoice, PURCHASE_AGE_DAYS);
};

/**
 * Tạo một hội viên và khóa đã thanh toán để thử hủy giữa khóa, bỏ qua nếu fixture đã có.
 * @returns {Promise<{classId: number, memberEmail: string, invoiceCode: string}>}
 */
export const seedRefundTestCourse = async () => {
  const existing = await prisma.gymClass.findFirst({ where: { name: COURSE_NAME } });
  if (existing) {
    const enrollment = await prisma.classEnrollment.findFirst({
      where: { classId: existing.id, member: { email: MEMBER_EMAIL } },
      include: { invoice: true },
    });
    if (!enrollment?.invoice) throw new Error('Dữ liệu khóa test hoàn tiền chưa hoàn chỉnh');
    return { classId: existing.id, memberEmail: MEMBER_EMAIL, invoiceCode: enrollment.invoice.code };
  }

  const [member, staff] = await Promise.all([
    loadRefundMember(),
    prisma.user.findUniqueOrThrow({ where: { email: 'letan@scms.local' } }),
  ]);
  const resources = await loadCourseResources({
    coachEmail: 'coach.yoga@scms.local',
    name: COURSE_NAME,
  });
  const gymClass = await createRefundClass(resources, staff);
  const invoice = await buyCourseAtCounter(member, gymClass, staff);
  await recordCompletedSessions(gymClass, member, resources.coach, invoice);
  return { classId: gymClass.id, memberEmail: MEMBER_EMAIL, invoiceCode: invoice.code };
};
