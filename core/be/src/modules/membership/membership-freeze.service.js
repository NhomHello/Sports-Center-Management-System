import { PERMISSIONS as P, SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { vietnamDay } from '../../common/utils/vietnam-date.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';
import * as settings from '../setting/setting.service.js';
import { shiftLaterPeriods, syncPeriods } from './membership-period.service.js';

/** Bảo lưu đang chạy tại `now` (đã tới ngày bắt đầu, chưa kết thúc). */
export const isFrozen = (freeze, now = new Date()) =>
  !freeze.endedAt && freeze.startAt <= now && now < freeze.endAt;

const freezeDays = (freeze) =>
  freeze.endedAt
    ? (freeze.creditedDays ?? 0)
    : Math.round((freeze.endAt - freeze.startAt) / TIME.MS_PER_DAY);

/**
 * Ngân sách bảo lưu của một kỳ: ngày đã dùng (đã cộng bù + lịch đang chờ), ngày còn lại.
 * @param {{ freezes: object[] }} membership
 */
export const freezeBudget = async (membership) => {
  const [minDays, maxTotal] = await Promise.all(
    [K.MEMBERSHIP_FREEZE_MIN_DAYS, K.MEMBERSHIP_FREEZE_MAX_TOTAL_DAYS].map(settings.getValue),
  );
  const used = membership.freezes.reduce((sum, f) => sum + freezeDays(f), 0);
  return {
    freezeDaysUsed: used,
    freezeDaysLeft: Math.max(0, maxTotal - used),
    freezeMinDays: minDays,
  };
};

async function loadMembership(db, id, context) {
  const item = await db.membership.findUnique({ where: { id }, include: { freezes: true } });
  if (!item) throw ApiError.notFound('Không tìm thấy gói tập');
  if (item.userId !== context.user.id && !context.permissions.has(P.MEMBERSHIP_FREEZE_ALL))
    throw ApiError.forbidden();
  return item;
}

async function validateFreeze(item, range, now) {
  const { freezeDaysLeft, freezeMinDays } = await freezeBudget(item);
  const days = Math.round((range.endAt - range.startAt) / TIME.MS_PER_DAY);
  if (item.freezes.some((f) => !f.endedAt))
    throw ApiError.conflict('Kỳ gói đang có lịch bảo lưu chưa kết thúc');
  if (item.status !== Enums.MembershipStatus.ACTIVE || item.startDate > now || item.endDate <= now)
    throw ApiError.businessRule('Chỉ bảo lưu kỳ gói đang hoạt động');
  if (range.startAt < vietnamDay(now) || range.startAt >= item.endDate)
    throw ApiError.businessRule('Ngày bắt đầu bảo lưu phải từ hôm nay và trước ngày hết hạn gói');
  if (days < freezeMinDays || days > freezeDaysLeft)
    throw ApiError.businessRule(
      `Mỗi lần bảo lưu từ ${freezeMinDays} ngày; kỳ này còn được bảo lưu ${freezeDaysLeft} ngày`,
    );
}

/** BR-1.16 (sửa theo góp ý): tổng các lần bảo lưu của một kỳ ≤ cấu hình; tới ngày thì FROZEN. */
export const freeze = (id, data, context) =>
  withScheduleTransaction(async (db) => {
    const item = await loadMembership(db, id, context);
    const now = new Date();
    const range = {
      startAt: new Date(`${data.from}T00:00:00+07:00`),
      endAt: new Date(`${data.to}T00:00:00+07:00`),
    };
    await validateFreeze(item, range, now);
    const result = await db.membershipFreeze.create({
      data: { membershipId: id, ...range, actorId: context.user.id },
    });
    await syncPeriods(db, item.userId, now);
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'MembershipFreeze',
      entityId: result.id,
      meta: data,
    });
    return result;
  });

/**
 * Kết thúc một lần bảo lưu: cộng đúng số ngày thực dừng vào kỳ, kỳ về ACTIVE và các kỳ mua nối
 * tiếp dời theo. Job tự mở lại và kết thúc sớm dùng cùng hàm nên chỉ cộng một lần.
 */
export const finishFreeze = async (db, freeze, now) => {
  if (freeze.endedAt) return freeze;
  const end = new Date(Math.min(vietnamDay(now).getTime(), freeze.endAt.getTime()));
  const creditedDays = Math.max(0, Math.round((end - freeze.startAt) / TIME.MS_PER_DAY));
  const membership = await db.membership.findUnique({ where: { id: freeze.membershipId } });
  const delta = creditedDays * TIME.MS_PER_DAY;
  await db.membership.update({
    where: { id: membership.id },
    data: {
      endDate: new Date(membership.endDate.getTime() + delta),
      ...(membership.status === Enums.MembershipStatus.FROZEN && {
        status: Enums.MembershipStatus.ACTIVE,
      }),
    },
  });
  await shiftLaterPeriods(db, membership, membership.endDate, delta);
  return db.membershipFreeze.update({
    where: { id: freeze.id },
    data: { endedAt: now, creditedDays },
  });
};

/** Kết thúc sớm (hoặc bỏ lịch chưa tới ngày) chỉ cộng ngày đã dừng, không cộng cả lịch dự kiến. */
export const resume = (id, context) =>
  withScheduleTransaction(async (db) => {
    const item = await loadMembership(db, id, context);
    const current = item.freezes.find((f) => !f.endedAt);
    if (!current) throw ApiError.conflict('Không có bảo lưu đang chờ kết thúc');
    const now = new Date();
    const result = await finishFreeze(db, current, now);
    await syncPeriods(db, item.userId, now);
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'MembershipFreeze',
      entityId: current.id,
      meta: { creditedDays: result.creditedDays },
    });
    return result;
  });

/** Kết thúc các lần bảo lưu đã hết hạn rồi đồng bộ trạng thái kỳ, trước mọi phép đọc/ghi gói. */
export const completeDueFreezes = async (db, userId, now) => {
  const freezes = await db.membershipFreeze.findMany({
    where: { membership: { userId }, endedAt: null, endAt: { lte: now } },
  });
  for (const item of freezes) await finishFreeze(db, item, now);
  return syncPeriods(db, userId, now);
};
