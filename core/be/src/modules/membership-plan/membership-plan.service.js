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
  const plan = await prisma.membershipPlan.create({ data });

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
