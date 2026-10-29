import { SETTING_KEYS as K } from '@scms/shared';
import { prisma, Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';
/** Chỉ số vận hành hội viên; ngưỡng nhắc gia hạn dùng cấu hình đang có. */
export const summary = async () => {
  const days = await getValue(K.MEMBERSHIP_EXPIRY_REMINDER_DAYS);
  const now = new Date();
  const end = new Date(now.getTime() + days * TIME.MS_PER_DAY);
  const [active, expiring] = await prisma.$transaction([
    prisma.user.count({ where: { status: Enums.UserStatus.ACTIVE, role: { isDefault: true } } }),
    prisma.user.count({
      where: {
        status: Enums.UserStatus.ACTIVE,
        memberships: {
          some: { status: Enums.MembershipStatus.ACTIVE, endDate: { gt: now, lte: end } },
        },
      },
    }),
  ]);
  return { active, expiring, reminderDays: days };
};
