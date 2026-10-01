import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { USER_WITH_ROLE, toPublicUser } from '../user/user.mapper.js';
import * as userService from '../user/user.service.js';

const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
});

/**
 * Lấy role mặc định dành cho hội viên.
 * @returns {Promise<object>}
 */
const getDefaultMemberRole = async () => {
  const defaultRole = await prisma.role.findFirst({
    where: { isDefault: true },
  });

  if (!defaultRole) {
    throw ApiError.businessRule('Hệ thống chưa cấu hình vai trò mặc định cho hội viên');
  }

  return defaultRole;
};

/**
 * Kiểm tra email và số điện thoại chưa được sử dụng.
 * @param {{ email?: string, phone?: string }} data
 * @param {number} [excludeId]
 * @returns {Promise<void>}
 */
const ensureUniqueIdentity = async ({ email, phone }, excludeId) => {
  if (email) {
    const emailOwner = await prisma.user.findFirst({
      where: {
        email,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (emailOwner) {
      throw ApiError.conflict('Email đã được sử dụng');
    }
  }

  if (phone) {
    const phoneOwner = await prisma.user.findFirst({
      where: {
        phone,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });

    if (phoneOwner) {
      throw ApiError.conflict('Số điện thoại đã được sử dụng');
    }
  }
};

/**
 * Bổ sung trạng thái ACTIVE/EXPIRED cho membership.
 * @param {object} membership
 * @returns {object}
 */
const toMembershipView = (membership) => ({
  ...membership,
  status: membership.endDate >= new Date() ? MEMBERSHIP_STATUS.ACTIVE : MEMBERSHIP_STATUS.EXPIRED,
});

/**
 * Lấy membership gần nhất của hội viên.
 * @param {number} memberId
 * @returns {Promise<object|null>}
 */
const getMembershipSummary = async (memberId) => {
  const membership = await prisma.membership.findFirst({
    where: { userId: memberId },
    include: { plan: true },
    orderBy: { endDate: 'desc' },
  });

  return membership ? toMembershipView(membership) : null;
};

/**
 * Lấy lịch sử membership của hội viên.
 * Gói STOPPED vẫn được include để không làm mất lịch sử.
 * @param {number} memberId
 * @returns {Promise<object[]>}
 */
const getMembershipHistory = async (memberId) => {
  const memberships = await prisma.membership.findMany({
    where: { userId: memberId },
    include: { plan: true },
    orderBy: { startDate: 'desc' },
  });

  return memberships.map(toMembershipView);
};

/**
 * Đăng ký hội viên tại quầy bằng vai trò mặc định của hệ thống.
 * @param {{ email?: string, password: string, fullName: string, phone: string }} data
 * @param {{ id: number }} actor
 * @returns {Promise<object>}
 */
export const create = async (data, actor) => {
  await ensureUniqueIdentity(data);

  const defaultRole = await getDefaultMemberRole();

  return userService.create(
    {
      ...data,
      roleId: defaultRole.id,
    },
    actor,
  );
};

/**
 * Tìm kiếm danh sách hội viên có phân trang và membership gần nhất.
 * @param {{ page: number, pageSize: number, search?: string }} query
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export const list = async (query) => {
  const defaultRole = await getDefaultMemberRole();

  const result = await userService.list({
    ...query,
    roleId: defaultRole.id,
  });

  const items = await Promise.all(
    result.items.map(async (member) => ({
      ...member,
      membership: await getMembershipSummary(member.id),
    })),
  );

  return {
    items,
    meta: result.meta,
  };
};

/**
 * Lấy chi tiết hội viên, membership gần nhất và lịch sử membership.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getById = async (id) => {
  const defaultRole = await getDefaultMemberRole();

  const member = await prisma.user.findFirst({
    where: {
      id,
      roleId: defaultRole.id,
    },
    include: USER_WITH_ROLE,
  });

  if (!member) {
    throw ApiError.notFound('Không tìm thấy hội viên');
  }

  const [membership, membershipHistory] = await Promise.all([
    getMembershipSummary(id),
    getMembershipHistory(id),
  ]);

  return {
    ...toPublicUser(member),
    membership,
    membershipHistory,
  };
};

/**
 * Cập nhật thông tin hội viên.
 * @param {number} id
 * @param {{ fullName?: string, email?: string, phone?: string }} data
 * @param {{ id: number }} actor
 * @returns {Promise<object>}
 */
export const update = async (id, data, actor) => {
  const oldMember = await getById(id);

  await ensureUniqueIdentity(data, id);

  const member = await prisma.user.update({
    where: { id },
    data,
    include: USER_WITH_ROLE,
  });

  const publicMember = toPublicUser(member);

  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.USER,
    entityId: id,
    meta: {
      oldValue: oldMember,
      newValue: publicMember,
    },
  });

  return publicMember;
};
