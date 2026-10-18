import { SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';
import { createForUsers } from '../notification/notification.service.js';
import * as settings from '../setting/setting.service.js';
import { vietnamDateTime } from '../../common/utils/vietnam-date.js';

/** Hạn chặn tính từ buổi vắng gần nhất; chưa đủ số buổi hoặc đã qua hạn thì không chặn. */
const blockEnd = (rows, { limit, blockDays, now }) => {
  if (rows.length < limit) return null;
  const until = new Date(rows[0].session.endAt.getTime() + blockDays * TIME.MS_PER_DAY);
  return until > now ? until : null;
};

/** BR-2.17: chỉ ABSENT của buổi đã kết thúc, chưa huỷ và chưa đổi lịch mới được tính. */
export const refreshNoShowBlock = async (db, memberId, now = new Date()) => {
  const member = await db.user.findUnique({ where: { id: memberId } });
  const [limit, windowDays, blockDays] = await Promise.all(
    [K.CLASS_NO_SHOW_LIMIT, K.CLASS_NO_SHOW_WINDOW_DAYS, K.CLASS_NO_SHOW_BLOCK_DAYS].map(
      settings.getValue,
    ),
  );
  const waivedAt = member.noShowWaivedAt ? member.noShowWaivedAt.getTime() : 0;
  const lower = new Date(Math.max(now.getTime() - windowDays * TIME.MS_PER_DAY, waivedAt));
  const rows = await db.attendance.findMany({
    where: {
      memberId,
      status: Enums.AttendanceStatus.ABSENT,
      session: {
        status: { not: Enums.SessionStatus.CANCELLED },
        rescheduledAt: null,
        endAt: { gt: lower, lte: now },
      },
    },
    include: { session: true },
    orderBy: { session: { endAt: 'desc' } },
  });
  const until = blockEnd(rows, { limit, blockDays, now });
  const current = member.bookingBlockedUntil > now ? member.bookingBlockedUntil : null;
  // Sửa điểm danh (vắng → có mặt) làm giảm số buổi vắng: rút ngắn hoặc gỡ chặn tương ứng.
  if (current && (!until || until < current)) {
    await db.user.update({ where: { id: memberId }, data: { bookingBlockedUntil: until } });
    return until;
  }
  if (!until || (current && current >= until)) return member.bookingBlockedUntil;
  await db.user.update({ where: { id: memberId }, data: { bookingBlockedUntil: until } });
  await createForUsers({
    db,
    userIds: [memberId],
    kind: Enums.NotificationKind.BOOKING_BLOCKED,
    title: 'Tạm chặn đăng ký lớp',
    message: `Bạn vắng nhiều buổi; được đăng ký lại từ ${vietnamDateTime(until)}.`,
    eventKey: `no-show:${memberId}:${until.toISOString()}`,
  });
  return until;
};

/** Nhân viên có quyền gỡ chặn phải để lại lý do; không tính lại các buổi đã được miễn. */
export const unblock = (memberId, reason, actor) =>
  withScheduleTransaction(async (db) => {
    const member = await db.user.findUnique({ where: { id: memberId } });
    if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
    await db.user.update({
      where: { id: memberId },
      data: { bookingBlockedUntil: null, noShowWaivedAt: new Date() },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'User',
      entityId: memberId,
      meta: { unblocked: true, reason },
    });
    return { bookingBlockedUntil: null };
  });
