import { Enums } from '../../config/db.js';
import { overlaps } from './class-schedule.service.js';
import { vietnamDateTime } from '../../common/utils/vietnam-date.js';

/** BR-1.16/2.17: chặn bảo lưu và vắng nhiều lần cho cả tự đăng ký lẫn đăng ký hộ. */
export const extraEnrollmentReason = async (db, memberId, sessions, now) => {
  const user = await db.user.findUnique({ where: { id: memberId } });
  if (user?.bookingBlockedUntil > now)
    return `Tạm chặn đăng ký đến ${vietnamDateTime(user.bookingBlockedUntil)}`;
  const freezes = await db.membershipFreeze.findMany({
    where: {
      membership: { userId: memberId },
      endedAt: null,
    },
  });
  if (
    freezes.some(
      (f) =>
        (f.startAt <= now && now < f.endAt) ||
        sessions.some((s) => overlaps(s, { startAt: f.startAt, endAt: f.endAt })),
    )
  )
    return 'Gói đang bảo lưu hoặc buổi học trùng khoảng bảo lưu';
  return null;
};

/** Giữ chỗ OFFERED còn hạn phải chiếm sức chứa như một booking. */
export const heldSeats = (db, classId, now, exceptMemberId) =>
  db.classWaitlist.count({
    where: {
      classId,
      status: Enums.WaitlistStatus.OFFERED,
      offeredUntil: { gt: now },
      ...(exceptMemberId && { memberId: { not: exceptMemberId } }),
    },
  });
