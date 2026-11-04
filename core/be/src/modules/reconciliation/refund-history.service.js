import { prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { refundCode, refundIdFromCode } from './refund-reference.js';

/** Admin tra mã hoàn hội viên cung cấp; không thay đổi số tiền hoặc trạng thái khi tìm kiếm. */
export const listRefunds = async (query) => {
  const codeId = refundIdFromCode(query.search);
  const where = {
    ...(query.status && { status: query.status }),
    ...(query.memberId && {
      AND: [
        { OR: [{ invoice: { userId: query.memberId } }, { case: { userId: query.memberId } }] },
      ],
    }),
    ...(query.search &&
      (codeId
        ? { id: codeId }
        : {
            OR: [
              { invoice: { code: { contains: query.search } } },
              { invoice: { user: { fullName: { contains: query.search } } } },
            ],
          })),
  };
  const [items, total] = await prisma.$transaction([
    prisma.refund.findMany({
      where,
      include: {
        invoice: {
          select: { id: true, code: true, userId: true, user: { select: { fullName: true } } },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.refund.count({ where }),
  ]);
  return {
    items: items.map((item) => ({ ...item, code: refundCode(item.id) })),
    meta: buildPageMeta({ ...query, total }),
  };
};
