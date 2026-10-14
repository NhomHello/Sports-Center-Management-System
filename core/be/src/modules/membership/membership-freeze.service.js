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

/** Chặn bảo lưu trước khi bắt đầu hoặc sau khi hết hạn; giữ endDate tới lúc kết thúc. */
export const isFrozen = (freeze, now = new Date()) =>
  !freeze.endedAt && freeze.startAt <= now && now < freeze.endAt;

async function loadMembership(db, id, context) {
  const item = await db.membership.findUnique({ where: { id }, include: { freezes: true } });
  if (!item) throw ApiError.notFound('Không tìm thấy gói tập');
  if (item.userId !== context.user.id && !context.permissions.has(P.MEMBERSHIP_FREEZE_ALL))
    throw ApiError.forbidden();
  return item;
}

async function validateFreeze(db, item, range) {
  const [min, max, times] = await Promise.all(
    [K.MEMBERSHIP_FREEZE_MIN_DAYS, K.MEMBERSHIP_FREEZE_MAX_DAYS, K.MEMBERSHIP_FREEZE_MAX_TIMES].map(
      settings.getValue,
    ),
  );
  const days = (range.endAt - range.startAt) / TIME.MS_PER_DAY;
  if (days < min || days > max) throw ApiError.businessRule(`Bảo lưu từ ${min} đến ${max} ngày`);
  if (
    item.status !== Enums.MembershipStatus.ACTIVE ||
    item.startDate > new Date() ||
    range.startAt < vietnamDay() ||
    item.endDate - range.startAt < min * TIME.MS_PER_DAY
  )
    throw ApiError.businessRule('Gói không còn đủ thời hạn để bảo lưu');
  if (item.freezes.length >= times || item.freezes.some((f) => !f.endedAt))
    throw ApiError.businessRule('Đã hết lượt hoặc đang có lịch bảo lưu');
  const booking = await db.classEnrollment.findFirst({
    where: {
      memberId: item.userId,
      status: Enums.EnrollmentStatus.BOOKED,
      gymClass: {
        sessions: {
          some: {
            status: Enums.SessionStatus.SCHEDULED,
            startAt: { lt: range.endAt },
            endAt: { gt: range.startAt },
          },
        },
      },
    },
  });
  if (booking) throw ApiError.conflict('Hãy huỷ các đăng ký trong khoảng bảo lưu trước');
}

/** BR-1.16: lịch bảo lưu được kiểm tra cùng khoá với đăng ký lớp. */
export const freeze = (id, data, context) =>
  withScheduleTransaction(async (db) => {
    const item = await loadMembership(db, id, context);
    const range = {
      startAt: new Date(`${data.from}T00:00:00+07:00`),
      endAt: new Date(`${data.to}T00:00:00+07:00`),
    };
    await validateFreeze(db, item, range);
    const result = await db.membershipFreeze.create({
      data: { membershipId: id, ...range, actorId: context.user.id },
    });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'MembershipFreeze',
      entityId: result.id,
      meta: data,
    });
    return result;
  });

/** Cộng số ngày thực dừng một lần; job và kết thúc sớm dùng cùng hàm. */
export const finishFreeze = async (db, freeze, now) => {
  if (freeze.endedAt) return freeze;
  const end = new Date(Math.min(vietnamDay(now).getTime(), freeze.endAt.getTime()));
  const creditedDays = Math.max(0, (end - freeze.startAt) / TIME.MS_PER_DAY);
  const membership = await db.membership.findUnique({ where: { id: freeze.membershipId } });
  await db.membership.update({
    where: { id: membership.id },
    data: {
      endDate: new Date(membership.endDate.getTime() + creditedDays * TIME.MS_PER_DAY),
    },
  });
  return db.membershipFreeze.update({
    where: { id: freeze.id },
    data: { endedAt: now, creditedDays },
  });
};

/** Kết thúc sớm chỉ cộng ngày đã dừng, không cộng cả lịch dự kiến. */
export const resume = (id, context) =>
  withScheduleTransaction(async (db) => {
    const item = await loadMembership(db, id, context);
    const current = item.freezes.find((f) => !f.endedAt);
    if (!current) throw ApiError.conflict('Không có bảo lưu đang chờ kết thúc');
    const result = await finishFreeze(db, current, new Date());
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'MembershipFreeze',
      entityId: current.id,
      meta: { creditedDays: result.creditedDays },
    });
    return result;
  });

/** Kết thúc lịch bảo lưu đã đến hạn trước phép ghi thanh toán/check-in trong cùng transaction. */
export const completeDueFreezes = async (db, userId, now) => {
  const freezes = await db.membershipFreeze.findMany({
    where: {
      membership: { userId },
      endedAt: null,
      endAt: { lte: now },
    },
  });
  for (const freeze of freezes) await finishFreeze(db, freeze, now);
};
