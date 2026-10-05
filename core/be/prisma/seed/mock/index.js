import { hashPassword } from '../../../src/common/utils/password.js';
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { SEED_MOCK_USERS } from './users.mock.js';
import { SEED_MOCK_PLANS } from './plans.mock.js';
import { seedMockClasses } from './classes.mock.js';

/** Tao user mau (bo qua neu da ton tai). Chay khi SEED_MOCK_DATA=true. */
export async function seedMockUsers() {
  const passwordHash = await hashPassword(env.SEED_MOCK_PASSWORD);
  const roles = await prisma.role.findMany({ select: { id: true, code: true } });
  const roleIdByCode = new Map(roles.map((r) => [r.code, r.id]));
  let created = 0;

  for (const { roleCode, ...data } of SEED_MOCK_USERS) {
    const roleId = roleIdByCode.get(roleCode);
    if (!roleId) {
      logger.warn({ roleCode }, 'Bo qua user mock: role khong ton tai');
      continue;
    }
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) continue;
    await prisma.user.create({ data: { ...data, passwordHash, roleId } });
    created += 1;
  }
  logger.info({ created, total: SEED_MOCK_USERS.length }, 'Seed mock users xong');
}

/** Gói mẫu phục vụ demo Sprint 1; chỉ tạo khi chưa có và không ghi đè chỉnh sửa nghiệp vụ. */
async function seedMockMembershipPlans() {
  let created = 0;
  for (const plan of SEED_MOCK_PLANS) {
    const existing = await prisma.membershipPlan.findUnique({ where: { code: plan.code } });
    if (existing) continue;
    await prisma.membershipPlan.create({ data: plan });
    created += 1;
  }
  logger.info({ created, total: SEED_MOCK_PLANS.length }, 'Seed mock membership plans xong');
}

/** Seed toàn bộ dữ liệu demo theo thứ tự phụ thuộc. */
export async function seedMockData() {
  await seedMockUsers();
  await seedMockMembershipPlans();
  await seedMockClasses();
}
