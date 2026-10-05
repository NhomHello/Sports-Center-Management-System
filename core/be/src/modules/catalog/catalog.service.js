import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';

async function ensureResourceAvailable(db, resource, id, data) {
  const field = resource === 'subject' ? 'subjectId' : 'roomId';
  const related = await db.gymClass.findMany({
    where: {
      [field]: id,
      status: { not: Enums.ClassStatus.CANCELLED },
      sessions: { some: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: new Date() } } },
    },
  });
  if (data.isActive === false && related.length) {
    throw ApiError.businessRule('Còn lớp đang sử dụng. Hãy chuyển lớp trước khi ngừng hoạt động.');
  }
  if (related.some((c) => data.capacity !== undefined && c.capacity > data.capacity)) {
    throw ApiError.businessRule('Sức chứa phòng không được nhỏ hơn sức chứa lớp đang sử dụng');
  }
}

/** Dịch vụ dùng chung cho bộ môn/phòng, luôn ngừng hoạt động thay vì xoá lịch sử. */
export const createCatalogService = (resource) => ({
  async list(query) {
    const where = {
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && { name: { contains: query.search } }),
    };
    const [data, total] = await prisma.$transaction([
      prisma[resource].findMany({ where, ...toPrismaPage(query), orderBy: { id: 'desc' } }),
      prisma[resource].count({ where }),
    ]);
    return { data, meta: buildPageMeta({ ...query, total }) };
  },
  create(data, actor) {
    return withScheduleTransaction(async (db) => {
      const item = await db[resource].create({ data });
      await writeScheduleAudit(db, actor, {
        action: AUDIT_ACTIONS.CREATE,
        entity: resource,
        entityId: item.id,
        meta: data,
      });
      return item;
    });
  },
  update(id, data, actor) {
    return withScheduleTransaction(async (db) => {
      if (!(await db[resource].findUnique({ where: { id } }))) throw ApiError.notFound();
      await ensureResourceAvailable(db, resource, id, data);
      const item = await db[resource].update({ where: { id }, data });
      await writeScheduleAudit(db, actor, {
        action: AUDIT_ACTIONS.UPDATE,
        entity: resource,
        entityId: id,
        meta: data,
      });
      return item;
    });
  },
});
