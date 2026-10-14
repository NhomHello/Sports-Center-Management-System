import { SETTING_KEYS as K } from '@scms/shared';
import { withScheduleTransaction } from '../../common/utils/schedule-transaction.js';
import { vietnamDay, nextDay } from '../../common/utils/vietnam-date.js';
import { Enums } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { AUDIT_ACTIONS, SPRINT3, TIME } from '../../constants/index.js';
import { finishFreeze } from '../membership/membership-freeze.service.js';
import * as settings from '../setting/setting.service.js';

/** BR-1.11: kiểm tra lại dưới khoá; notification và trạng thái commit cùng nhau. */
export const runMembershipLifecycle = async (now = new Date(), userId) => {
  const days = await settings.getValue(K.MEMBERSHIP_EXPIRY_REMINDER_DAYS);
  const today = vietnamDay(now);
  const upper = new Date(nextDay(today).getTime() + days * TIME.MS_PER_DAY);
  const scope = userId ? { userId } : {};
  return withScheduleTransaction(async (db) => {
    const ended = await db.membershipFreeze.findMany({
      where: { endedAt: null, endAt: { lte: now }, membership: scope },
    });
    for (const freeze of ended) await finishFreeze(db, freeze, now);
    const items = await db.membership.findMany({
      where: { status: Enums.MembershipStatus.ACTIVE, endDate: { lt: upper }, ...scope },
      include: { plan: true, freezes: { where: { endedAt: null } } },
    });
    let expired = 0;
    for (const item of items) {
      if (item.freezes.some((f) => f.startAt <= now)) continue;
      const isExpired = item.endDate <= now;
      if (isExpired) {
        await db.membership.update({
          where: { id: item.id },
          data: {
            status: Enums.MembershipStatus.EXPIRED,
            activeUserId: null,
          },
        });
        await db.auditLog.create({
          data: {
            action: AUDIT_ACTIONS.UPDATE,
            entity: 'Membership',
            entityId: String(item.id),
            meta: { status: Enums.MembershipStatus.EXPIRED },
          },
        });
        expired += 1;
      }
      await db.notification.createMany({
        skipDuplicates: true,
        data: [
          {
            userId: item.userId,
            membershipId: item.id,
            kind: isExpired
              ? Enums.NotificationKind.MEMBERSHIP_EXPIRED
              : Enums.NotificationKind.MEMBERSHIP_EXPIRY_REMINDER,
            dedupeKey: `membership-${isExpired ? 'expired' : 'expiry'}:${item.id}:${item.endDate.toISOString()}`,
            title: isExpired ? 'Gói tập đã hết hạn' : 'Gói tập sắp hết hạn',
            message: `${item.plan.name}: ${isExpired ? 'đã hết hạn' : 'sắp hết hạn'}. Gia hạn tại mục Gói tập.`,
          },
        ],
      });
    }
    logger.info({ expired, checked: items.length }, 'Đã chạy nhắc gia hạn / hết hạn gói');
    return { expired, checked: items.length };
  });
};

/** Worker chạy lúc khởi động và xuyên qua ngày Việt Nam; dedupe bền vững qua restart. */
export const startMembershipReminderJob = () => {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runMembershipLifecycle();
    } catch (err) {
      logger.error({ err }, 'Job membership lỗi');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, SPRINT3.JOB_INTERVAL_MS);
  timer.unref();
  tick();
  return () => clearInterval(timer);
};
