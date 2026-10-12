import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';
import { createCatalogService } from '../catalog/catalog.service.js';

const catalogService = createCatalogService('room');

const getOpenClassesByRoom = async (roomId) =>
  prisma.$queryRaw`
    SELECT
      id,
      name,
      capacity,
      status
    FROM gym_classes
    WHERE room_id = ${roomId}
      AND status = 'OPEN'
    ORDER BY id DESC
  `;

const validateCapacity = async (roomId, capacity) => {
  if (capacity === undefined) return;

  const classes = await getOpenClassesByRoom(roomId);

  const invalidClass = classes.find((gymClass) => gymClass.capacity > capacity);

  if (invalidClass) {
    throw ApiError.businessRule('Sức chứa phòng không được nhỏ hơn sức chứa lớp đang sử dụng');
  }
};

const buildWhere = (query) => ({
  ...(query.isActive !== undefined && { isActive: query.isActive }),
  ...(query.search && { name: { contains: query.search } }),
});

/** Dịch vụ quản lý phòng tập. */
export const roomService = {
  async list(query) {
    const where = buildWhere(query);

    const [rooms, total] = await prisma.$transaction([
      prisma.room.findMany({
        where,
        ...toPrismaPage(query),
        orderBy: { id: 'desc' },
      }),
      prisma.room.count({ where }),
    ]);

    const data = await Promise.all(
      rooms.map(async (room) => ({
        ...room,
        assignedClasses: await getOpenClassesByRoom(room.id),
      })),
    );

    return {
      data,
      meta: buildPageMeta({ ...query, total }),
    };
  },

  create: catalogService.create,

  async update(id, data, actor) {
    await validateCapacity(id, data.capacity);

    return catalogService.update(id, data, actor);
  },
};
