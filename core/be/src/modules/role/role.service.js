import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { invalidateRoleCache } from '../permission/permission.service.js';

const ROLE_INCLUDE = {
  permissions: { select: { permission: { select: { code: true } } } },
  _count: { select: { users: true } },
};

/** @param {object} role record Role (include ROLE_INCLUDE) */
const toRoleDto = ({ permissions, _count, ...role }) => ({
  ...role,
  userCount: _count.users,
  permissionCodes: permissions.map((item) => item.permission.code),
});

/**
 * Doi permission code -> id, bao loi neu co code khong ton tai.
 * @param {string[]} codes
 * @returns {Promise<number[]>}
 */
const resolvePermissionIds = async (codes) => {
  const unique = [...new Set(codes)];
  if (unique.length === 0) return [];
  const found = await prisma.permission.findMany({
    where: { code: { in: unique } },
    select: { id: true, code: true },
  });
  if (found.length !== unique.length) {
    const foundCodes = new Set(found.map((p) => p.code));
    const missing = unique.filter((code) => !foundCodes.has(code));
    throw ApiError.badRequest('Permission không tồn tại', { missing });
  }
  return found.map((p) => p.id);
};

/** Danh sach role kem so user va permission codes. */
export const list = async () => {
  const roles = await prisma.role.findMany({ include: ROLE_INCLUDE, orderBy: { id: 'asc' } });
  return roles.map(toRoleDto);
};

/** @param {number} id */
export const getById = async (id) => {
  const role = await prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE });
  if (!role) throw ApiError.notFound('Không tìm thấy vai trò');
  return toRoleDto(role);
};

/**
 * @param {{ code: string, name: string, description?: string, permissionCodes: string[] }} data
 * @param {{ id: number }} actor
 */
export const create = async ({ permissionCodes, ...data }, actor) => {
  const permissionIds = await resolvePermissionIds(permissionCodes);
  const role = await prisma.role.create({
    data: {
      ...data,
      permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
    },
    include: ROLE_INCLUDE,
  });
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.CREATE,
    entity: ENTITIES.ROLE,
    entityId: role.id,
  });
  return toRoleDto(role);
};

/**
 * Sua ten/mo ta va (neu gui) thay toan bo permission cua role.
 * @param {number} id
 * @param {{ name?: string, description?: string, permissionCodes?: string[] }} data
 * @param {{ id: number }} actor
 */
export const update = async (id, { permissionCodes, ...data }, actor) => {
  await getById(id);
  const permissionIds = permissionCodes ? await resolvePermissionIds(permissionCodes) : null;

  const role = await prisma.$transaction(async (tx) => {
    if (permissionIds) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
      });
    }
    return tx.role.update({ where: { id }, data, include: ROLE_INCLUDE });
  });

  invalidateRoleCache(id);
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.ROLE,
    entityId: id,
    meta: { permissionCodes },
  });
  return toRoleDto(role);
};

/**
 * Xoa role: khong xoa role he thong, khong xoa role dang co user.
 * @param {number} id
 * @param {{ id: number }} actor
 */
export const remove = async (id, actor) => {
  const role = await getById(id);
  if (role.isSystem) throw ApiError.businessRule('Không thể xoá vai trò hệ thống');
  if (role.userCount > 0) {
    throw ApiError.businessRule(
      'Vai trò đang được gán cho tài khoản, hãy đổi vai trò của họ trước',
    );
  }
  await prisma.role.delete({ where: { id } });
  invalidateRoleCache(id);
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.DELETE,
    entity: ENTITIES.ROLE,
    entityId: id,
  });
};

/**
 * Dat role mac dinh cho tai khoan tu dang ky (chi mot role duoc isDefault).
 * @param {number} id
 * @param {{ id: number }} actor
 */
export const setDefault = async (id, actor) => {
  await getById(id);
  await prisma.$transaction([
    prisma.role.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
    prisma.role.update({ where: { id }, data: { isDefault: true } }),
  ]);
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.ROLE,
    entityId: id,
    meta: { isDefault: true },
  });
  return getById(id);
};
