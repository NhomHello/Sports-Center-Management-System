import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';

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
    meta: buildPageMeta({
      page,
      pageSize,
      total,
    }),
  };
};
