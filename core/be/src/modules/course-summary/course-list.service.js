import { PERMISSIONS as P } from '@scms/shared';
import { prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';

/** Danh sách tổng kết theo đúng tác giả; quyền báo cáo thông thường không mở phạm vi toàn bộ. */
export const listSummaries = async (query, context) => {
  const where = {
    ...(!context.permissions.has(P.COURSE_SUMMARY_VIEW_ALL) && { coachId: context.user.id }),
    ...(query.status && { status: query.status }),
    ...(query.q && { gymClass: { name: { contains: query.q } } }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.courseSummary.findMany({
      where,
      ...toPrismaPage(query),
      orderBy: { id: 'desc' },
      select: {
        id: true,
        classId: true,
        status: true,
        deadlineAt: true,
        publishedAt: true,
        revision: true,
        gymClass: { select: { name: true } },
        coach: { select: { id: true, fullName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.courseSummary.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};
