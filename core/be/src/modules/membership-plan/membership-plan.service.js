import { MembershipPlanStatus } from '@prisma/client';
import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';

/**
 * Lấy danh sách gói tập có phân trang.
 * @param {{ page: number, pageSize: number }} query
 * @returns {Promise<{ data: object[], meta: object }>}
 */
export const list = async (query) => {
  const { page, pageSize } = query;
  const pagination = toPrismaPage(query);

  const [data, total] = await prisma.$transaction([
    prisma.membershipPlan.findMany({
      ...pagination,
      orderBy: { id: 'desc' },
    }),
    prisma.membershipPlan.count(),
  ]);

  return {
    data,
    meta: buildPageMeta({ page, pageSize, total }),
  };
};

/**
 * Lấy các gói tập đang được bán.
 * @returns {Promise<object[]>}
 */
export const listSelling = async () =>
  prisma.membershipPlan.findMany({
    where: {
      status: MembershipPlanStatus.SELLING,
    },
    orderBy: {
      id: 'desc',
    },
  });

/**
 * Lấy chi tiết gói tập.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getById = async (id) => {
  const plan = await prisma.membershipPlan.findUnique({
    where: { id },
  });

  if (!plan) {
    throw ApiError.notFound('Không tìm thấy gói tập');
  }

  return plan;
};

/**
 * Tạo gói tập.
 * @param {object} data
 * @param {{ id: number }} actor
 * @returns {Promise<object>}
 */
export const create = async (data, actor) => {
  const plan = await prisma.membershipPlan.create({
    data,
  });

  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.CREATE,
    entity: ENTITIES.MEMBERSHIP_PLAN,
    entityId: plan.id,
  });

  return plan;
};

/**
 * Cập nhật gói tập.
 * @param {number} id
 * @param {object} data
 * @param {{ id: number }} actor
 * @returns {Promise<object>}
 */
export const update = async (id, data, actor) => {
  await getById(id);

  const plan = await prisma.membershipPlan.update({
    where: { id },
    data,
  });

  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.UPDATE,
    entity: ENTITIES.MEMBERSHIP_PLAN,
    entityId: id,
  });

  return plan;
};

/**
 * Xoá hoặc ngừng bán gói tập.
 * Gói chưa được sử dụng thì xoá hẳn.
 * Gói đã có membership tham chiếu thì chỉ chuyển sang STOPPED.
 * @param {number} id
 * @param {{ id: number }} actor
 * @returns {Promise<object|null>}
 */
export const remove = async (id, actor) => {
  const plan = await getById(id);

  const referenceCount = await prisma.membership.count({
    where: {
      planId: id,
    },
  });

  if (referenceCount === 0) {
    await prisma.membershipPlan.delete({
      where: { id },
    });

    recordAudit({
      userId: actor.id,
      action: AUDIT_ACTIONS.DELETE,
      entity: ENTITIES.MEMBERSHIP_PLAN,
      entityId: id,
      meta: {
        deleted: true,
        oldValue: plan,
      },
    });

    return null;
  }

  const stoppedPlan = await prisma.membershipPlan.update({
    where: { id },
    data: {
      status: MembershipPlanStatus.STOPPED,
    },
  });

  recordAudit({
    userId: actor.id,
    action: AUDIT_ACTIONS.DELETE,
    entity: ENTITIES.MEMBERSHIP_PLAN,
    entityId: id,
    meta: {
      deleted: false,
      status: MembershipPlanStatus.STOPPED,
    },
  });

  return stoppedPlan;
};
