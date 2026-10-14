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

/** BR-2.17: chỉ ABSENT của buổi đã kết thúc, chưa huỷ và chưa đổi lịch mới được tính. */
export const refreshNoShowBlock = async (db, memberId, now = new Date()) => {
  const member = await db.user.findUnique({ where: { id: memberId } });
  const [limit, windowDays, blockDays] = await Promise.all(
    [K.CLASS_NO_SHOW_LIMIT, K.CLASS_NO_SHOW_WINDOW_DAYS, K.CLASS_NO_SHOW_BLOCK_DAYS].map(
      settings.getValue,
    ),
  );
  const lower = new Date(
    Math.max(now.getTime() - windowDays * TIME.MS_PER_DAY, member.noShowWaivedAt?.getTime() ?? 0),
  );
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
  if (rows.length < limit) return member.bookingBlockedUntil;
  const until = new Date(rows[0].session.endAt.getTime() + blockDays * TIME.MS_PER_DAY);
  if (until <= now || (member.bookingBlockedUntil && member.bookingBlockedUntil >= until))
    return member.bookingBlockedUntil;
  await db.user.update({ where: { id: memberId }, data: { bookingBlockedUntil: until } });
  await createForUsers({
    db,
    userIds: [memberId],
    kind: Enums.NotificationKind.BOOKING_BLOCKED,
    title: 'Tạm chặn đăng ký lớp',
    message: `Bạn vắng nhiều buổi; được đăng ký lại từ ${until.toISOString()}.`,
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
