/**
 * Seed idempotent: chay bao nhieu lan cung an toan (upsert), khong xoa du lieu.
 * Chay: npm run db:seed   (tu dong chay trong `npm run dev` o thu muc goc)
 */
import { getSettingValidationError, listPermissions, SETTING_DEFINITIONS } from '@scms/shared';
import { hashPassword } from '../../src/common/utils/password.js';
import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { logger } from '../../src/config/logger.js';
import { seedMockData } from './mock/index.js';
import { SEED_ADMIN_ROLE_CODE, SEED_ROLES } from './roles.seed.js';

/** Dong bo registry permission vao DB (them moi + cap nhat label). */
async function seedPermissions() {
  const permissions = listPermissions();
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { module: p.module, moduleLabel: p.moduleLabel, action: p.action, label: p.label },
    });
  }
  logger.info({ count: permissions.length }, 'Seed permissions xong');
  return permissions;
}

/**
 * Gan permission cho role (xoa het roi gan lai).
 * @param {number} roleId
 * @param {string[]} codes
 */
async function setRolePermissions(roleId, codes) {
  const perms = await prisma.permission.findMany({
    where: { code: { in: codes } },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: perms.map(({ id }) => ({ roleId, permissionId: id })),
    }),
  ]);
}

/**
 * @param {ReturnType<typeof listPermissions>} allPermissions
 */
async function seedRoles(allPermissions) {
  const allCodes = allPermissions.map((p) => p.code);
  for (const def of SEED_ROLES) {
    const { permissions, ...data } = def;
    const existing = await prisma.role.findUnique({ where: { code: data.code } });
    const role = existing ?? (await prisma.role.create({ data }));
    const isAdminRole = permissions === 'ALL';
    // Role quan tri luon full quyen; role khac chi gan quyen khi vua tao moi
    if (isAdminRole || !existing) {
      await setRolePermissions(role.id, isAdminRole ? allCodes : permissions);
    }
  }
  logger.info({ count: SEED_ROLES.length }, 'Seed roles xong');
}

/** Tao tai khoan quan tri dau tien tu bien moi truong SEED_ADMIN_*. */
async function seedAdminUser() {
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
    logger.warn('Bo qua seed admin: thieu SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD trong .env');
    return;
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: SEED_ADMIN_ROLE_CODE } });
  const existing = await prisma.user.findUnique({ where: { email: env.SEED_ADMIN_EMAIL } });
  if (existing) {
    if (!existing.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { emailVerifiedAt: new Date() },
      });
    }
    logger.info({ email: env.SEED_ADMIN_EMAIL }, 'Admin da ton tai, bo qua');
    return;
  }
  await prisma.user.create({
    data: {
      email: env.SEED_ADMIN_EMAIL,
      passwordHash: await hashPassword(env.SEED_ADMIN_PASSWORD),
      fullName: env.SEED_ADMIN_NAME,
      emailVerifiedAt: new Date(),
      roleId: adminRole.id,
    },
  });
  logger.info({ email: env.SEED_ADMIN_EMAIL }, 'Da tao tai khoan admin');
}

/** Tao setting con thieu voi gia tri mac dinh (khong ghi de gia tri manager da sua). */
async function seedSettings() {
  for (const def of SETTING_DEFINITIONS) {
    const {
      defaultValue,
      unit: _unit,
      minValue: _min,
      maxValue: _max,
      integer: _integer,
      required: _required,
      format: _format,
      minLength: _minLength,
      maxLength: _maxLength,
      ...record
    } = def;
    const existing = await prisma.systemSetting.findUnique({ where: { key: def.key } });
    const repairValue = existing && getSettingValidationError(def, existing.value);
    await prisma.systemSetting.upsert({
      where: { key: def.key },
      create: { ...record, value: defaultValue },
      update: {
        label: def.label,
        description: def.description,
        group: def.group,
        type: def.type,
        ...(repairValue && { value: defaultValue }),
      },
    });
  }
  logger.info({ count: SETTING_DEFINITIONS.length }, 'Seed settings xong');
}

async function main() {
  const permissions = await seedPermissions();
  await seedRoles(permissions);
  await seedAdminUser();
  await seedSettings();
  if (env.SEED_MOCK_DATA) await seedMockData();
}

main()
  .catch((err) => {
    logger.error({ err }, 'Seed that bai');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
