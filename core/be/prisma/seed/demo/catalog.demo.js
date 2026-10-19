import { hashPassword } from '../../../src/common/utils/password.js';
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { DEMO_MEMBERS, DEMO_PLANS, DEMO_ROOMS, DEMO_STAFF, DEMO_SUBJECTS } from './data.demo.js';

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
  const rooms = {};
  for (const item of DEMO_ROOMS) {
    rooms[item.name] = await prisma.room.upsert({
      where: { name: item.name },
      update: { capacity: item.capacity, description: item.description, isActive: true },
      create: item,
    });
  }
  return { subjects, rooms };
};

/** Gói tập theo mã; cập nhật lại giá/thời hạn về bản chuẩn nếu đã có. */
const seedPlans = async () => {
  const plans = {};
  for (const { code, ...data } of DEMO_PLANS) {
    plans[code] = await prisma.membershipPlan.upsert({
      where: { code },
      update: data,
      create: { code, ...data },
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
  return { subjects, rooms, plans, users };
};
