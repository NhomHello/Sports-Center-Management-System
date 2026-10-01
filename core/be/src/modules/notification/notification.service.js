import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

async function createExpiryReminders(userId) {
  const reminderDays = await settingService.getValue(SETTING_KEYS.MEMBERSHIP_EXPIRY_REMINDER_DAYS);
  const now = new Date();
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      status: Enums.MembershipStatus.ACTIVE,
      endDate: { gt: now, lte: new Date(now.getTime() + reminderDays * TIME.MS_PER_DAY) },
    },
    include: { plan: true },
  });
  if (!memberships.length) return;
  const dateFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: VIETNAM_TIME_ZONE });
  // BR-1.5: createMany + dedupeKey cho phép chạy lại sau lỗi mà không gửi trùng.
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: memberships.map((membership) => ({
      userId,
      membershipId: membership.id,
      kind: Enums.NotificationKind.MEMBERSHIP_EXPIRY_REMINDER,
      dedupeKey: `membership-expiry:${membership.id}:${membership.endDate.toISOString()}`,
      title: 'Gói tập sắp hết hạn',
      message: `Gói ${membership.plan.name} sẽ hết hạn vào ${dateFormatter.format(membership.endDate)}.`,
    })),
  });
}

/** UC-UM-17: danh sách và tổng chưa đọc đều giới hạn theo id đã xác thực. */
export const listForUser = async (userId, query) => {
  await createExpiryReminders(userId);
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
  return { items, meta: { ...buildPageMeta({ ...query, total }), unreadCount } };
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
    title,
    message,
    dedupeKey: `${eventKey}:${userId}`,
  }));
  const result = await db.notification.createMany({ data, skipDuplicates: true });
  return result.count;
};
