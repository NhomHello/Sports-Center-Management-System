import { Enums } from '../../config/db.js';

const { ACTIVE, FROZEN } = Enums.MembershipStatus;

/** Kỳ còn giá trị: đang chạy, đang bảo lưu hoặc mua trước chờ tới lượt. */
export const LIVE_STATUSES = Object.freeze([ACTIVE, FROZEN]);

const runningFreeze = (now) => ({ endedAt: null, startAt: { lte: now }, endAt: { gt: now } });

/**
 * Dời các kỳ mua nối tiếp đứng sau một kỳ (theo mốc kết thúc cũ của kỳ đó) thêm `deltaMs`.
 * Dùng khi kỳ trước được cộng bù bảo lưu (+) hoặc bị hủy/đổi giữa chừng (−).
 * @param {object} db transaction client
 * @param {{ id: number, userId: number }} period
 * @param {Date} oldEnd mốc kết thúc của kỳ trước khi thay đổi
 * @param {number} deltaMs
 */
export const shiftLaterPeriods = async (db, period, oldEnd, deltaMs) => {
  if (!deltaMs) return;
  const later = await db.membership.findMany({
    where: {
      userId: period.userId,
      id: { not: period.id },
      status: { in: LIVE_STATUSES },
      startDate: { gte: oldEnd },
    },
    orderBy: { startDate: 'asc' },
  });
  for (const item of later)
    await db.membership.update({
      where: { id: item.id },
      data: {
        startDate: new Date(item.startDate.getTime() + deltaMs),
        endDate: new Date(item.endDate.getTime() + deltaMs),
      },
    });
};

/**
 * Kỳ đang hiệu lực: kỳ sớm nhất đã bắt đầu, đang bảo lưu hoặc chưa hết hạn. Kỳ đứng sau một kỳ
 * đang bảo lưu chưa được tính là bắt đầu vì sẽ bị dời khi kỳ trước được cộng bù.
 */
export const findCurrentPeriod = (db, userId, now = new Date(), include) =>
  db.membership.findFirst({
    where: {
      userId,
      startDate: { lte: now },
      OR: [{ status: FROZEN }, { status: ACTIVE, endDate: { gt: now } }],
    },
    orderBy: { startDate: 'asc' },
    ...(include && { include }),
  });

/**
 * Đưa trạng thái các kỳ của một hội viên về đúng thời điểm `now`: bảo lưu tới ngày → FROZEN,
 * kỳ quá hạn → EXPIRED, chỉ kỳ đang hiệu lực giữ `activeUserId` (ràng buộc unique một kỳ/người).
 * Gọi sau `completeDueFreezes` (kết thúc bảo lưu đã tới hạn) trong cùng transaction.
 * @returns {Promise<object|null>} kỳ đang hiệu lực
 */
export const syncPeriods = async (db, userId, now = new Date()) => {
  await db.membership.updateMany({
    where: { userId, status: ACTIVE, freezes: { some: runningFreeze(now) } },
    data: { status: FROZEN },
  });
  await db.membership.updateMany({
    where: { userId, status: ACTIVE, endDate: { lte: now } },
    data: { status: Enums.MembershipStatus.EXPIRED, activeUserId: null },
  });
  const current = await findCurrentPeriod(db, userId, now);
  await db.membership.updateMany({
    where: { activeUserId: userId, ...(current && { id: { not: current.id } }) },
    data: { activeUserId: null },
  });
  if (current && current.activeUserId !== userId)
    await db.membership.update({ where: { id: current.id }, data: { activeUserId: userId } });
  return current;
};

/** Mốc bắt đầu cho kỳ mua mới: nối sau kỳ còn giá trị muộn nhất, không thì từ lúc thanh toán. */
export const nextPeriodStart = async (db, userId, paidAt) => {
  const last = await db.membership.findFirst({
    where: { userId, status: { in: LIVE_STATUSES } },
    orderBy: { endDate: 'desc' },
  });
  return last && last.endDate > paidAt ? last.endDate : paidAt;
};

/**
 * Kết thúc hẳn một kỳ (hủy, đổi, hoàn hoá đơn): CANCELLED, bỏ lịch bảo lưu chưa chạy, các kỳ mua
 * nối tiếp dời lên đúng phần thời gian được giải phóng để không bị hở.
 */
export const endPeriod = async (db, period, now = new Date()) => {
  const cutoff = period.startDate > now ? period.startDate : now;
  const freed = Math.max(0, period.endDate.getTime() - cutoff.getTime());
  await db.membership.update({
    where: { id: period.id },
    data: { status: Enums.MembershipStatus.CANCELLED, cancelledAt: now, activeUserId: null },
  });
  await db.membershipFreeze.updateMany({
    where: { membershipId: period.id, endedAt: null },
    data: { endedAt: now, creditedDays: 0 },
  });
  await shiftLaterPeriods(db, period, period.endDate, -freed);
  return syncPeriods(db, period.userId, now);
};
