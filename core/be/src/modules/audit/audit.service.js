import { prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';

/** BR-0.1/0.2: chỉ đọc lịch sử, không cung cấp thao tác sửa hoặc xóa. */
export const list = async (query) => {
  const { userId, search, action, entity, entityId, from, to } = query;
  const where = {
    ...(userId && { userId }),
    ...(action && { action }),
    ...(entity && { entity }),
    ...(entityId && { entityId }),
    ...((from || to) && { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } }),
    ...(search && { user: { fullName: { contains: search } } }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};
