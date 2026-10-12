import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';

/**
 * Lay danh sach lop dang mo.
 *
 * @param {{ page: number, pageSize: number }} query
 */
export const listOpenClasses = async (query) => {
  const page = toPrismaPage(query);

  const where = {
    status: Enums.ClassStatus.OPEN,
    endsOn: {
      gte: new Date(),
    },
  };

  const [items, total] = await Promise.all([
    prisma.gymClass.findMany({
      where,
      ...page,
      orderBy: [{ startsOn: 'asc' }, { id: 'asc' }],
      include: {
        subject: true,
        room: true,
        coach: {
          select: {
            id: true,
            fullName: true,
          },
        },
        sessions: {
          where: {
            status: Enums.SessionStatus.SCHEDULED,
            startAt: { gt: new Date() },
          },
          orderBy: {
            startAt: 'asc',
          },
        },
      },
    }),
    prisma.gymClass.count({ where }),
  ]);

  return {
    data: items,
    meta: buildPageMeta({
      page: query.page,
      pageSize: query.pageSize,
      total,
    }),
  };
};

/**
 * Lay chi tiet lop theo id.
 *
 * @param {number} id
 */
export const getById = async (id) => {
  const item = await prisma.gymClass.findUnique({
    where: { id },
    include: {
      subject: true,
      room: true,
      coach: {
        select: {
          id: true,
          fullName: true,
        },
      },
      sessions: {
        orderBy: {
          startAt: 'asc',
        },
      },
    },
  });

  if (!item) {
    throw ApiError.notFound('Không tìm thấy lớp');
  }

  return item;
};
