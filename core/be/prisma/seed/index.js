/**
 * Seed idempotent: chay bao nhieu lan cung an toan (upsert), khong xoa du lieu.
 * Chay: npm run db:seed   (tu dong chay trong `npm run dev` o thu muc goc)
 */
import { getSettingValidationError, listPermissions, SETTING_DEFINITIONS } from '@scms/shared';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../../src/common/utils/password.js';
import { prisma } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../src/constants/index.js';
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
 * Quyen mac dinh duoc them vao code SAU khi role da tao (vd. attendance.record cho HLV) se khong
 * bao gio den duoc DB cu. Bo sung moi cap (role, quyen) con thieu DUNG MOT LAN va ghi audit
 * `meta.seedBackfill`; lan seed sau bo qua cac quyen da bo sung, nen manager go quyen tren UI
 * thi seed khong cap lai.
 * @param {{ id: number }} role
 * @param {string[]} defaults
 */
async function backfillRolePermissions(role, defaults) {
  const [current, logs] = await Promise.all([
    prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permission: { select: { code: true } } },
    }),
    prisma.auditLog.findMany({
      where: { entity: ENTITIES.ROLE, entityId: String(role.id), action: AUDIT_ACTIONS.UPDATE },
      select: { meta: true },
    }),
  ]);
  const done = new Set([
    ...current.map((row) => row.permission.code),
    ...logs.flatMap((log) => log.meta?.seedBackfill ?? []),
  ]);
  const missing = defaults.filter((code) => !done.has(code));
  if (missing.length === 0) return;
  const perms = await prisma.permission.findMany({
    where: { code: { in: missing } },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.rolePermission.createMany({
      data: perms.map(({ id }) => ({ roleId: role.id, permissionId: id })),
      skipDuplicates: true,
    }),
    prisma.auditLog.create({
      data: {
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.ROLE,
        entityId: String(role.id),
        meta: { seedBackfill: missing },
      },
    }),
  ]);
  logger.info({ role: role.code, added: missing }, 'Bo sung quyen mac dinh moi cho role');
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
    } else {
      await backfillRolePermissions(role, permissions);
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

/**
 * Seed nền: quyền, vai trò, admin, cấu hình; dữ liệu mock tuỳ SEED_MOCK_DATA.
 * Script demo (prisma/seed/demo) gọi với mock=false để không lẫn dữ liệu mẫu cũ.
 * @param {{ mock?: boolean }} [options]
 */
export async function seedBase({ mock = env.SEED_MOCK_DATA } = {}) {
  const permissions = await seedPermissions();
  await seedRoles(permissions);
  await seedAdminUser();
  await seedSettings();
  if (mock) await seedMockData();
}

// Chỉ tự chạy khi gọi trực tiếp (npm run db:seed), không chạy khi được import.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seedBase()
    .catch((err) => {
      logger.error({ err }, 'Seed that bai');
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
