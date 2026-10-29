import { Enums } from '../../config/db.js';
import { finishFreeze } from './membership-freeze.service.js';
import { syncPeriods } from './membership-period.service.js';

// Không gắn membershipId: bảng thông báo unique (membershipId, kind) nên mỗi kỳ chỉ có một thông
// báo mỗi loại, trong khi một kỳ có thể bắt đầu / kết thúc bảo lưu nhiều lần.
const notice = (membership, { key, title, message }) => ({
  userId: membership.userId,
  kind: Enums.NotificationKind.MEMBERSHIP_FROZEN,
  dedupeKey: key,
  title,
  message,
});

/**
 * GY-40: tới ngày bắt đầu thì kỳ chuyển FROZEN, hết hạn bảo lưu thì tự mở lại và cộng bù đúng số
 * ngày đã dừng. Mỗi chuyển trạng thái báo hội viên một lần (dedupeKey theo lần bảo lưu).
 * Chạy trong transaction của job vòng đời gói.
 * @returns {Promise<Set<number>>} hội viên có kỳ vừa đổi trạng thái
 */
export const runFreezeTransitions = async (db, now, scope = {}) => {
  const ending = await db.membershipFreeze.findMany({
    where: { endedAt: null, endAt: { lte: now }, membership: scope },
    include: { membership: true },
  });
  const starting = await db.membershipFreeze.findMany({
    where: {
      endedAt: null,
      startAt: { lte: now },
      endAt: { gt: now },
      membership: { ...scope, status: Enums.MembershipStatus.ACTIVE },
    },
    include: { membership: true },
  });
  const notices = [];
  for (const freeze of ending) {
    const done = await finishFreeze(db, freeze, now);
    notices.push(
      notice(freeze.membership, {
        key: `freeze-resume:${freeze.id}`,
        title: 'Gói tập đã mở lại sau bảo lưu',
        message: `Đã cộng bù ${done.creditedDays} ngày bảo lưu vào hạn gói.`,
      }),
    );
  }
  for (const freeze of starting)
    notices.push(
      notice(freeze.membership, {
        key: `freeze-start:${freeze.id}`,
        title: 'Gói tập bắt đầu bảo lưu',
        message: 'Trong thời gian bảo lưu bạn không check-in được; hạn gói sẽ được cộng bù.',
      }),
    );
  const users = new Set([...ending, ...starting].map((f) => f.membership.userId));
  for (const userId of users) await syncPeriods(db, userId, now);
  if (notices.length) await db.notification.createMany({ skipDuplicates: true, data: notices });
  return users;
};
