import { SETTING_KEYS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';
import { USER_WITH_ROLE, toPublicUser } from '../user/user.mapper.js';
import { isFrozen } from '../membership/membership-freeze.service.js';

async function membershipFilter(filter) {
  const now = new Date();
  const active = {
    status: Enums.MembershipStatus.ACTIVE,
    startDate: { lte: now },
    endDate: { gt: now },
  };
  const filters = {
    ACTIVE: { memberships: { some: active } },
    NO_PLAN: { memberships: { none: {} } },
    UNVERIFIED: { email: { not: null }, emailVerifiedAt: null },
    FROZEN: {
      memberships: {
        some: { freezes: { some: { endedAt: null, startAt: { lte: now }, endAt: { gt: now } } } },
      },
    },
  };
  if (filter === 'EXPIRING') {
    const days = await getValue(SETTING_KEYS.MEMBERSHIP_EXPIRY_REMINDER_DAYS);
    return {
      memberships: {
        some: {
          ...active,
          endDate: { gt: now, lte: new Date(now.getTime() + days * TIME.MS_PER_DAY) },
        },
      },
    };
  }
  return filters[filter] ?? {};
}
/** Bộ lọc thực hiện trước phân trang để không bỏ sót hồ sơ ngoài trang hiện tại. */
export const list = async (query) => {
  const where = {
    role: { isDefault: true },
    ...(await membershipFilter(query.membershipFilter)),
    ...(query.search && {
      OR: ['fullName', 'email', 'phone'].map((field) => ({ [field]: { contains: query.search } })),
    }),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        ...USER_WITH_ROLE,
        memberships: {
          take: 1,
          orderBy: { endDate: 'desc' },
          include: { plan: true, freezes: true },
        },
      },
      orderBy: { id: 'desc' },
      ...toPrismaPage(query),
    }),
    prisma.user.count({ where }),
  ]);
  const now = new Date();
  const items = users.map(({ memberships, ...user }) => {
    const current = memberships[0];
    return {
      ...toPublicUser(user),
      currentMembership: current
        ? { ...current, isFrozen: current.freezes.some((f) => isFrozen(f, now)) }
        : null,
    };
  });
  return { items, meta: buildPageMeta({ ...query, total }) };
};
