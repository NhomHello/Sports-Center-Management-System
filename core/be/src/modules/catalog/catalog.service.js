import { ApiError } from '../../common/errors/api-error.js';
import { recordAudit } from '../../common/utils/audit.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';

const buildWhere = (query) => ({
  ...(query.isActive !== undefined && {
    isActive: query.isActive,
  }),
  ...(query.search && {
    name: {
      contains: query.search,
    },
  }),
});

const listResource = async (resource, query) => {
  const where = buildWhere(query);

  const [data, total] = await prisma.$transaction([
    prisma[resource].findMany({
      where,
      ...toPrismaPage(query),
      orderBy: { id: 'desc' },
    }),
    prisma[resource].count({ where }),
  ]);

  return {
    data,
    meta: buildPageMeta({ ...query, total }),
  };
};

const createResource = async (resource, data, actor) => {
  const item = await prisma[resource].create({ data });

  await recordAudit({
    userId: actor?.id ?? null,
    action: AUDIT_ACTIONS.CREATE,
    entity: resource,
    entityId: item.id,
    meta: data,
  });

  return item;
};

const updateResource = async (resource, id, data, actor) => {
  const existing = await prisma[resource].findUnique({
    where: { id },
  });

  if (!existing) {
    throw ApiError.notFound();
  }

  const item = await prisma[resource].update({
    where: { id },
    data,
  });

  await recordAudit({
    userId: actor?.id ?? null,
    action: AUDIT_ACTIONS.UPDATE,
    entity: resource,
    entityId: id,
    meta: data,
  });

  return item;
};

/**
 * Tao service dung chung cho danh muc don gian.
 * Delete duoc xu ly bang update isActive = false.
 *
 * @param {string} resource
 * @returns {object}
 */
export const createCatalogService = (resource) => ({
  list: (query) => listResource(resource, query),
  create: (data, actor) => createResource(resource, data, actor),
  update: (id, data, actor) => updateResource(resource, id, data, actor),
});
