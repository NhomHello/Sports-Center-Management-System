import { randomUUID } from 'node:crypto';
import { prisma } from '../../src/config/db.js';
import { hashPassword } from '../../src/common/utils/password.js';
import { loginAs, loginAsAdmin } from './api.js';

/** Fixture riêng từng suite; không thay đổi tài khoản hoặc quyền đã seed. */
export const createSprintFixture = async () => {
  const prefix = `TEST_S1_${randomUUID().replaceAll('-', '')}`;
  const password = 'Sprint1@Test123';
  const role = await prisma.role.findFirstOrThrow({ where: { isDefault: true } });
  const passwordHash = await hashPassword(password);
  const member = await prisma.user.create({
    data: {
      email: `${prefix}_1@scms.test`,
      fullName: `${prefix} Member`,
      roleId: role.id,
      passwordHash,
    },
  });
  const other = await prisma.user.create({
    data: {
      email: `${prefix}_2@scms.test`,
      fullName: `${prefix} Other`,
      roleId: role.id,
      passwordHash,
    },
  });
  return {
    prefix,
    password,
    member,
    other,
    userIds: [member.id, other.id],
    roleIds: [],
    auditIds: [],
    memberToken: await loginAs(member.email, password),
    otherToken: await loginAs(other.email, password),
    adminToken: await loginAsAdmin(),
  };
};

/** Chỉ dọn bản ghi của fixture; dữ liệu nghiệp vụ và lịch sử đang có được giữ. */
export const cleanupSprintFixture = async (fixture) => {
  if (!fixture) return;
  const whereUser = { userId: { in: fixture.userIds } };
  await prisma.notification.deleteMany({ where: whereUser });
  await prisma.payment.deleteMany({ where: { invoice: whereUser } });
  await prisma.invoice.deleteMany({ where: whereUser });
  await prisma.membership.deleteMany({ where: whereUser });
  await prisma.auditLog.deleteMany({
    where: { OR: [{ userId: { in: fixture.userIds } }, { id: { in: fixture.auditIds } }] },
  });
  await prisma.user.deleteMany({ where: { id: { in: fixture.userIds } } });
  await prisma.membershipPlan.deleteMany({ where: { code: { startsWith: fixture.prefix } } });
  await prisma.systemSetting.deleteMany({ where: { key: { startsWith: fixture.prefix } } });
  await prisma.role.deleteMany({ where: { id: { in: fixture.roleIds } } });
};
