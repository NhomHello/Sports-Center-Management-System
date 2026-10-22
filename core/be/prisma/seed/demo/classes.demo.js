import { ApiError } from '../../../src/common/errors/api-error.js';
import { prisma } from '../../../src/config/db.js';
import { logger } from '../../../src/config/logger.js';
import { TIME } from '../../../src/constants/index.js';
import * as classService from '../../../src/modules/class/class.service.js';
import { enroll } from '../../../src/modules/class/class-enrollment.service.js';
import { DEMO_CLASS_WEEKS, DEMO_CLASSES } from './class-schedule.demo.js';
import { buyCourseAtCounter } from './payments.demo.js';

const VN_OFFSET_MS = 7 * TIME.MS_PER_HOUR;
const vnDate = (ms) => new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
const DAYS_PER_WEEK = 7;
// Đóng đăng ký trước buổi cuối một tuần để lớp vẫn "Mở đăng ký" suốt thời gian demo.
const REGISTRATION_TAIL_WEEKS = 1;

const classPayload = (definition, { subjects, rooms, users }) => {
  const now = Date.now();
  const weeks = DEMO_CLASS_WEEKS * DAYS_PER_WEEK * TIME.MS_PER_DAY;
  const tail = REGISTRATION_TAIL_WEEKS * DAYS_PER_WEEK * TIME.MS_PER_DAY;
  return {
    name: definition.name,
    description: `Lớp ${definition.subject} do ${users[definition.coach].fullName} phụ trách.`,
    subjectId: subjects[definition.subject].id,
    roomId: rooms[definition.room].id,
    coachId: users[definition.coach].id,
    capacity: definition.capacity,
    price: definition.price,
    startsOn: vnDate(now + TIME.MS_PER_DAY),
    endsOn: vnDate(now + weeks),
    weeklySchedule: definition.slots.map(([dayOfWeek, startTime, endTime]) => ({
      dayOfWeek,
      startTime,
      endTime,
    })),
    registrationStartAt: new Date(now).toISOString(),
    registrationEndAt: new Date(now + weeks - tail).toISOString(),
    status: 'OPEN',
  };
};

/**
 * Tạo các lớp demo qua class.service (sinh buổi, kiểm tra trùng phòng/HLV như khi quản lý tạo).
 * @returns {Promise<Record<string, object>>} lớp theo key trong DEMO_CLASSES
 */
export const seedDemoClasses = async (catalog) => {
  const manager = catalog.users.quanly;
  const classes = {};
  for (const definition of DEMO_CLASSES) {
    classes[definition.key] = await classService.create(classPayload(definition, catalog), manager);
  }
  return classes;
};

/**
 * Đăng ký lớp hộ hội viên qua đúng service: lớp miễn phí đăng ký trực tiếp, lớp có học phí bán
 * khóa tại quầy và thu tiền mặt. Lỗi nghiệp vụ (trùng giờ, hết chỗ...) chỉ ghi log để seed chạy
 * tiếp, giống thực tế có người đăng ký không thành.
 */
export const enrollMembers = async (gymClass, members, staff) => {
  for (const member of members) {
    try {
      if (gymClass.price > 0) await buyCourseAtCounter(member, gymClass, staff);
      else await enroll(gymClass.id, member.id, staff);
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
      logger.debug({ class: gymClass.name, member: member.email, reason: err.message }, 'Bỏ qua');
    }
  }
};

/**
 * Thêm một buổi đang diễn ra hôm nay cho lớp và lùi thời điểm đăng ký về trước buổi đó, để HLV
 * mở "Điểm danh" ngay khi demo (điểm danh chỉ nhận buổi đã bắt đầu và người đăng ký trước giờ học).
 */
export const addOngoingSession = async (gymClass, { startedMinutesAgo, durationMinutes }) => {
  const startAt = new Date(Date.now() - startedMinutesAgo * TIME.MS_PER_MINUTE);
  const endAt = new Date(startAt.getTime() + durationMinutes * TIME.MS_PER_MINUTE);
  const template = await prisma.classSession.findFirstOrThrow({ where: { classId: gymClass.id } });
  const { roomId, coachId, roomName, coachName } = template;
  const session = await prisma.classSession.create({
    data: { classId: gymClass.id, startAt, endAt, roomId, coachId, roomName, coachName },
  });
  await prisma.classEnrollment.updateMany({
    where: { classId: gymClass.id },
    data: { enrolledAt: new Date(startAt.getTime() - TIME.MS_PER_DAY) },
  });
  return session;
};
