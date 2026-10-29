import { SETTING_KEYS as K, PERMISSIONS as P } from '@scms/shared';
import { prisma, Enums } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';

/** Hội viên chỉ đọc đánh giá của mình, kể cả khi cửa sổ sửa đã kết thúc. */
export const ownRating = async (classId, memberId) => {
  const summary = await prisma.courseSummary.findFirst({
    where: { classId, items: { some: { memberId } } },
    select: { id: true },
  });
  if (!summary) throw ApiError.forbidden('Chỉ hội viên có tổng kết khóa mới được đánh giá');
  const [last, rating, days] = await Promise.all([
    prisma.classSession.findFirst({
      where: { classId, status: { not: Enums.SessionStatus.CANCELLED } },
      orderBy: { endAt: 'desc' },
      select: { endAt: true },
    }),
    prisma.courseRating.findUnique({
      where: { classId_memberId: { classId, memberId } },
      select: { id: true, courseStars: true, coachStars: true, comment: true, hiddenAt: true },
    }),
    getValue(K.COURSE_RATING_WINDOW_DAYS),
  ]);
  const now = new Date();
  const deadlineAt = last ? new Date(last.endAt.getTime() + days * TIME.MS_PER_DAY) : null;
  const ended = last && last.endAt <= now;
  const canRate = Boolean(ended && now < deadlineAt);
  return {
    rating,
    deadlineAt,
    canRate,
    reason: canRate ? null : ended ? 'Đã hết thời hạn đánh giá khóa học' : 'Khóa học chưa kết thúc',
  };
};

/** Danh sách HLV có đánh giá dành riêng cho người kiểm duyệt, gồm tài khoản đã ngừng hoạt động. */
export const ratedCoaches = async () => {
  const ids = await prisma.courseRating.findMany({
    distinct: ['coachId'],
    select: { coachId: true },
  });
  return prisma.user.findMany({
    where: {
      id: { in: ids.map((r) => r.coachId) },
      role: { permissions: { some: { permission: { code: P.SCHEDULE_VIEW_TEACHING } } } },
    },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  });
};
