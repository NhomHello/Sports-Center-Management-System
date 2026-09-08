import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { TIME } from '../../constants/index.js';

/** @type {Map<number, { codes: Set<string>, expiresAt: number }>} */
const roleCache = new Map();

/**
 * Lay tap permission code cua mot role (co cache TTL ngan).
 * Day la ham DUY NHAT ma authorize middleware dung de quyet dinh quyen.
 * @param {number} roleId
 * @returns {Promise<Set<string>>}
 */
export const getCodesByRoleId = async (roleId) => {
  const cached = roleCache.get(roleId);
  if (cached && cached.expiresAt > Date.now()) return cached.codes;

  const rows = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { code: true } } },
  });
  const codes = new Set(rows.map((row) => row.permission.code));
  roleCache.set(roleId, {
    codes,
    expiresAt: Date.now() + env.PERMISSION_CACHE_TTL_SECONDS * TIME.MS_PER_SECOND,
  });
  return codes;
};

/**
 * Xoa cache khi role doi quyen. Khong truyen roleId => xoa het.
 * @param {number} [roleId]
 */
export const invalidateRoleCache = (roleId) => {
  if (roleId === undefined) roleCache.clear();
  else roleCache.delete(roleId);
};

/**
 * Danh sach permission nhom theo module, dung cho ma tran phan quyen tren UI.
 * @returns {Promise<{ module: string, moduleLabel: string, permissions: { id: number, code: string, action: string, label: string }[] }[]>}
 */
export const listGrouped = async () => {
  const permissions = await prisma.permission.findMany({ orderBy: { id: 'asc' } });
  const groups = new Map();
  for (const { id, code, module, moduleLabel, action, label } of permissions) {
    if (!groups.has(module)) groups.set(module, { module, moduleLabel, permissions: [] });
    groups.get(module).permissions.push({ id, code, action, label });
  }
  return [...groups.values()];
};
