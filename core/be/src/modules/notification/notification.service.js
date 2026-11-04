import { NOTIFICATION_LIMITS } from '../../constants/index.js';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { prisma } from '../../config/db.js';

/** UC-UM-17: danh sách và tổng chưa đọc đều giới hạn theo id đã xác thực. */
export const listForUser = async (userId, query) => {
  const where = {
    userId,
    ...(query.kind && { kind: query.kind }),
    ...(query.readStatus === 'UNREAD' && { readAt: null }),
    ...(query.readStatus === 'READ' && { readAt: { not: null } }),
  };
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    items,
    meta: { ...buildPageMeta({ ...query, total }), unreadCount },
  };
};

/** Đọc lặp giữ nguyên readAt; không thể thay đổi notification của người khác. */
export const markRead = async (id, userId) => {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  const notification = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notification) throw ApiError.notFound('Không tìm thấy thông báo');
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
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
};

/** Tạo thông báo có khoá chống trùng cho từng người nhận. */
export const createForUsers = async ({ userIds, kind, title, message, eventKey, db = prisma }) => {
  if (userIds.length === 0) return 0;
  const data = userIds.map((userId) => ({
    userId,
    kind,
    title: title.slice(0, NOTIFICATION_LIMITS.TITLE),
    message: message.slice(0, NOTIFICATION_LIMITS.MESSAGE),
    dedupeKey: `${eventKey}:${userId}`,
  }));
  const result = await db.notification.createMany({ data, skipDuplicates: true });
  return result.count;
};
