import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { hashPassword } from '../../common/utils/password.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { cancelBookingsForLock } from './user-booking-lock.service.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { USER_WITH_ROLE, toPublicUser } from './user.mapper.js';
import { USER_TEACHING_INCLUDE, withTeaching } from './coach-subject.service.js';

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
      include: USER_TEACHING_INCLUDE,
      orderBy: { id: 'desc' },
      ...toPrismaPage(query),
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items: items.map((item) => withTeaching(toPublicUser(item))),
    meta: buildPageMeta({ ...query, total }),
  };
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
    // Nhân viên tạo hộ và chịu trách nhiệm xác nhận email, nên không bắt xác minh lại.
    data: {
      ...data,
      passwordHash: await hashPassword(password),
      ...(data.email && { emailVerifiedAt: new Date() }),
    },
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
export const updateStatus = async (id, status, actor, confirmed = false) => {
  if (id === actor.id) throw ApiError.businessRule('Không thể tự khoá tài khoản của chính mình');
  const user = await withScheduleTransaction(async (db) => {
    if (status === Enums.UserStatus.INACTIVE) await cancelBookingsForLock(db, id, actor, confirmed);
    const updated = await db.user.update({
      where: { id },
      data: { status },
      include: USER_WITH_ROLE,
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CHANGE_STATUS,
      entity: ENTITIES.USER,
      entityId: id,
      meta: { status },
    });
    return updated;
  });
  return toPublicUser(user);
};

/**
 * Xác minh email thủ công khi hội viên không nhận được thư. Nhân viên chịu trách nhiệm đã đối chiếu
 * danh tính với hội viên (trực tiếp hoặc qua kênh hỗ trợ); thao tác được ghi nhật ký.
 * @param {number} id
 * @param {{ id: number }} actor
 */
export const verifyEmailManually = async (id, actor) => {
  const user = await prisma.user.findUnique({ where: { id }, include: USER_WITH_ROLE });
  if (!user) throw ApiError.notFound('Không tìm thấy tài khoản');
  if (!user.email) throw ApiError.businessRule('Tài khoản không có email để xác minh');
  if (user.emailVerifiedAt) return toPublicUser(user);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({
      where: { userId: id, purpose: Enums.EmailTokenPurpose.VERIFY_EMAIL, usedAt: null },
    });
    return tx.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date() },
      include: USER_WITH_ROLE,
    });
  });
  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.USER,
    entityId: id,
    meta: { manualEmailVerification: true, email: user.email },
  });
  return toPublicUser(updated);
};
