import { hashPassword } from '../../../src/common/utils/password.js';
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import {
  DEMO_COACH_SUBJECTS,
  DEMO_PLANS,
  DEMO_ROOM_TYPES,
  DEMO_ROOMS,
  DEMO_STAFF,
  DEMO_SUBJECTS,
} from './data.demo.js';
import { DEMO_MEMBERS } from './members.demo.js';

/** Loại phòng với bộ môn được dạy (góp ý GV: mỗi loại phòng một chức năng). */
const seedRoomTypes = async (subjects) => {
  const types = {};
  for (const { subjects: names, ...item } of DEMO_ROOM_TYPES) {
    const links = names.map((name) => ({ subjectId: subjects[name].id }));
    types[item.name] = await prisma.roomType.upsert({
      where: { name: item.name },
      update: { ...item, subjects: { deleteMany: {}, create: links } },
      create: { ...item, subjects: { create: links } },
    });
  }
  return types;
};

/** Chuyên môn HLV theo DEMO_COACH_SUBJECTS. */
const seedCoachSubjects = async (users, subjects) => {
  for (const [key, names] of Object.entries(DEMO_COACH_SUBJECTS)) {
    const coachId = users[key].id;
    await prisma.coachSubject.deleteMany({ where: { coachId } });
    await prisma.coachSubject.createMany({
      data: names.map((name) => ({ coachId, subjectId: subjects[name].id })),
    });
  }
};

/** Bộ môn và phòng: upsert theo tên để chạy lại nhiều lần không nhân bản. */
const seedResources = async () => {
  const subjects = {};
  for (const item of DEMO_SUBJECTS) {
    subjects[item.name] = await prisma.subject.upsert({
      where: { name: item.name },
      update: { description: item.description, isActive: true },
      create: item,
    });
  }
  const types = await seedRoomTypes(subjects);
  const rooms = {};
  for (const { type, ...item } of DEMO_ROOMS) {
    const fields = { ...item, roomTypeId: types[type].id, isActive: true };
    rooms[item.name] = await prisma.room.upsert({
      where: { name: item.name },
      update: fields,
      create: fields,
    });
  }
  return { subjects, rooms };
};

/** Gói tự tập theo mã kèm khung giờ / khu vực; cập nhật lại về bản chuẩn nếu đã có. */
const seedPlans = async () => {
  const frames = await prisma.operatingFrame.findMany();
  const types = await prisma.roomType.findMany();
  const frameId = new Map(frames.map((item) => [item.name, item.id]));
  const typeId = new Map(types.map((item) => [item.name, item.id]));
  const plans = {};
  for (const { code, frames: frameNames, areas, ...data } of DEMO_PLANS) {
    const access = {
      frames: { create: frameNames.map((name) => ({ frameId: frameId.get(name) })) },
      areas: { create: areas.map((name) => ({ roomTypeId: typeId.get(name) })) },
    };
    plans[code] = await prisma.membershipPlan.upsert({
      where: { code },
      update: {
        ...data,
        frames: { deleteMany: {}, ...access.frames },
        areas: { deleteMany: {}, ...access.areas },
      },
      create: { code, ...data, ...access },
    });
  }
  return plans;
};

/** Tài khoản demo đã xác minh email, mật khẩu chung SEED_MOCK_PASSWORD. */
const seedUsers = async () => {
  const roles = await prisma.role.findMany({ select: { id: true, code: true } });
  const roleId = new Map(roles.map((role) => [role.code, role.id]));
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  const users = {};
  for (const { role, ...data } of [...DEMO_STAFF, ...DEMO_MEMBERS]) {
    const fields = {
      ...data,
      passwordHash,
      roleId: roleId.get(role),
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      bookingBlockedUntil: null,
    };
    users[data.email.split('@')[0]] = await prisma.user.upsert({
      where: { email: data.email },
      update: fields,
      create: fields,
    });
  }
  users.admin = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
  return users;
};

/**
 * Tạo danh mục demo: bộ môn, phòng, gói tập và tài khoản (nhân viên + 30 hội viên).
 * @returns {Promise<{ subjects: object, rooms: object, plans: object, users: object }>}
 */
export const seedDemoCatalog = async () => {
  const { subjects, rooms } = await seedResources();
  const plans = await seedPlans();
  const users = await seedUsers();
  await seedCoachSubjects(users, subjects);
  return { subjects, rooms, plans, users };
};
