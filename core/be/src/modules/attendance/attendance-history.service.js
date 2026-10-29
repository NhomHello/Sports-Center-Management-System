import { prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';

/** UC-AT-03: phạm vi luôn lấy từ JWT, không nhận memberId từ query. */
export const listOwn = async (memberId, query) => {
  const where = {
    memberId,
    ...(query.status && { status: query.status }),
    session: {
      ...(query.classId && { classId: query.classId }),
      ...((query.from || query.to) && {
        startAt: {
          ...(query.from && { gte: new Date(`${query.from}T00:00:00+07:00`) }),
          ...(query.to && { lte: new Date(`${query.to}T23:59:59.999+07:00`) }),
        },
      }),
    },
  };
  const [items, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      ...toPrismaPage(query),
      orderBy: [{ session: { startAt: 'desc' } }, { id: 'desc' }],
      include: { session: { include: { gymClass: { select: { id: true, name: true } } } } },
    }),
    prisma.attendance.count({ where }),
  ]);
  const actors = await prisma.user.findMany({
    where: { id: { in: [...new Set(items.map((i) => i.actorId))] } },
    select: { id: true, fullName: true },
  });
  return {
    items: items.map((i) => ({ ...i, actor: actors.find((a) => a.id === i.actorId) ?? null })),
    meta: buildPageMeta({ ...query, total }),
  };
};
