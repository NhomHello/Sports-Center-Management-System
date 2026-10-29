import { prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';

/** UC-PAY-08: lịch sử từng lần nhận tiền; read_own không tin memberId do client gửi. */
export const list = async (query, actor, canReadAll) => {
  const userId = canReadAll ? query.memberId : actor.id;
  const where = {
    invoice: {
      ...(userId && { userId }),
      ...(query.status && { status: query.status }),
      ...(query.channel && { channel: query.channel }),
      ...(query.search && { code: { contains: query.search } }),
    },
    ...((query.from || query.to) && {
      paidAt: { ...(query.from && { gte: query.from }), ...(query.to && { lte: query.to }) },
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            code: true,
            status: true,
            user: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.payment.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};
