import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { hashPassword } from '../../common/utils/password.js';
import { prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { USER_WITH_ROLE, toPublicUser } from './user.mapper.js';

/**
 * Dieu kien where tu query tim kiem.
 * @param {{ search?: string, roleId?: number, status?: string }} filters
 */
const buildWhere = ({ search, roleId, status }) => ({
  ...(roleId && { roleId }),
  ...(status && { status }),
  ...(search && {
    OR: [
      { email: { contains: search } },
      { fullName: { contains: search } },
      { phone: { contains: search } },
    ],
  }),
});

/**
 * Danh sach tai khoan co phan trang + tim kiem.
 * @param {{ page: number, pageSize: number, search?: string, roleId?: number, status?: string }} query
 */
export const list = async (query) => {
  const where = buildWhere(query);
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: USER_WITH_ROLE,
      orderBy: { id: 'desc' },
      ...toPrismaPage(query),
    }),
    prisma.user.count({ where }),
  ]);
  return { items: items.map(toPublicUser), meta: buildPageMeta({ ...query, total }) };
};

/** @param {number} id */
export const getById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id }, include: USER_WITH_ROLE });
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
  return toPublicUser(user);
};

/**
 * Manager tao tai khoan (coach, le tan...) va chi dinh role.
 * @param {{ email: string, password: string, fullName: string, phone?: string, roleId: number }} data
 * @param {{ id: number }} actor nguoi thuc hien
 */
export const create = async ({ password, ...data }, actor) => {
  const user = await prisma.user.create({
    data: { ...data, passwordHash: await hashPassword(password) },
    include: USER_WITH_ROLE,
  });
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.CREATE,
    entity: ENTITIES.USER,
    entityId: user.id,
  });
  return toPublicUser(user);
};

/**
 * Doi role cua tai khoan. Khong cho tu doi role cua chinh minh (tranh tu khoa minh).
 * @param {number} id
 * @param {number} roleId
 * @param {{ id: number }} actor
 */
export const updateRole = async (id, roleId, actor) => {
  if (id === actor.id) throw ApiError.businessRule('Không thể tự đổi vai trò của chính mình');
  const user = await prisma.user.update({
    where: { id },
    data: { roleId },
    include: USER_WITH_ROLE,
  });
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.ASSIGN_ROLE,
    entity: ENTITIES.USER,
    entityId: id,
    meta: { roleId },
  });
  return toPublicUser(user);
};

/**
 * Khoa / mo khoa tai khoan.
 * @param {number} id
 * @param {string} status
 * @param {{ id: number }} actor
 */
export const updateStatus = async (id, status, actor) => {
  if (id === actor.id) throw ApiError.businessRule('Không thể tự khoá tài khoản của chính mình');
  const user = await prisma.user.update({
    where: { id },
    data: { status },
    include: USER_WITH_ROLE,
  });
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.CHANGE_STATUS,
    entity: ENTITIES.USER,
    entityId: id,
    meta: { status },
  });
  return toPublicUser(user);
};
