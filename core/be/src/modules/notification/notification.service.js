import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';

/** Lấy thông báo của đúng người dùng đang đăng nhập. */
export const listForUser = async (userId, query) => {
  const where = {
    userId,
    ...(query.isRead !== undefined && { readAt: query.isRead ? { not: null } : null }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...toPrismaPage(query),
    }),
    prisma.notification.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};

/** Đánh dấu một thông báo của chính người dùng; gọi lặp lại vẫn trả cùng bản ghi. */
export const markRead = async (id, userId) => {
  const [notification] = await markManyRead([id], userId);
  return notification;
};

/** Đánh dấu nhiều thông báo thuộc đúng người dùng trong một thao tác idempotent. */
export const markManyRead = async (ids, userId) => {
  const uniqueIds = [...new Set(ids)];
  const owned = await prisma.notification.findMany({
    where: { id: { in: uniqueIds }, userId },
    select: { id: true },
  });
  if (owned.length !== uniqueIds.length) throw ApiError.notFound('Không tìm thấy thông báo');
  await prisma.notification.updateMany({
    where: { id: { in: uniqueIds }, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return prisma.notification.findMany({
    where: { id: { in: uniqueIds }, userId },
    orderBy: { createdAt: 'desc' },
  });
};

/** Tạo thông báo có khoá chống trùng cho từng người nhận. */
export const createForUsers = async ({ userIds, kind, title, message, eventKey, db = prisma }) => {
  if (userIds.length === 0) return 0;
  const data = userIds.map((userId) => ({
    userId,
    kind,
    title,
    message,
    dedupeKey: `${eventKey}:${userId}`,
  }));
  const result = await db.notification.createMany({ data, skipDuplicates: true });
  return result.count;
};
