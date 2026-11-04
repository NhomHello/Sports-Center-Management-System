import { Enums, prisma } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { HISTORY_INCLUDE, historyView } from './cancellation-history.mapper.js';
import { refundIdFromCode } from '../reconciliation/refund-reference.js';

const whereFor = (query, ownerId) => {
  const refundId = refundIdFromCode(query.search);
  const search = !query.search
    ? {}
    : refundId
      ? { refundId }
      : {
          OR: [
            { user: { fullName: { contains: query.search } } },
            { fromInvoice: { code: { contains: query.search } } },
            { fromInvoice: { planName: { contains: query.search } } },
          ],
        };

  return {
    kind: Enums.PurchaseChangeKind.CANCEL_COURSE,
    ...(ownerId && { userId: ownerId }),
    ...search,
  };
};

const project = async (rows) => {
  const logs = await prisma.auditLog.findMany({
    where: { entity: 'PurchaseChange', entityId: { in: rows.map((r) => String(r.id)) } },
    select: { entityId: true, meta: true },
    orderBy: { id: 'desc' },
  });
  return rows.map((row) =>
    historyView(row, logs.find((log) => log.entityId === String(row.id))?.meta ?? {}),
  );
};

/** Người gọi /me bị khóa phạm vi theo JWT; nhân viên có thể lọc đúng hội viên đang xử lý. */
export const list = async (query, ownerId) => {
  const where = whereFor(query, ownerId);
  const [rows, total] = await prisma.$transaction([
    prisma.purchaseChange.findMany({
      where,
      include: HISTORY_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.purchaseChange.count({ where }),
  ]);
  return { items: await project(rows), meta: buildPageMeta({ ...query, total }) };
};

/** Không được xem lịch sử của người khác qua việc đoán ID. */
export const getById = async (id, ownerId) => {
  const row = await prisma.purchaseChange.findFirst({
    where: { id, ...whereFor({}, ownerId) },
    include: HISTORY_INCLUDE,
  });
  if (!row) throw ApiError.notFound('Không tìm thấy lịch sử hủy trong phạm vi truy cập');
  return (await project([row]))[0];
};

/** Hóa đơn cũ vẫn PAID để giữ chứng từ nhưng quyền học có thể đã hủy; không dựa vào booking mới. */
export const latestForInvoice = async (invoiceId) => {
  const row = await prisma.purchaseChange.findFirst({
    where: {
      fromInvoiceId: invoiceId,
      kind: Enums.PurchaseChangeKind.CANCEL_COURSE,
      status: Enums.PurchaseChangeStatus.DONE,
    },
    include: HISTORY_INCLUDE,
    orderBy: { id: 'desc' },
  });
  return row ? (await project([row]))[0] : null;
};
