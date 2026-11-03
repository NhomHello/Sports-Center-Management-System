import { Enums, prisma } from '../../config/db.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { USER_WITH_ROLE, toPublicUser } from '../user/user.mapper.js';

const registered = { status: Enums.EnrollmentStatus.BOOKED };
const filters = {
  REGISTERED: { classEnrollments: { some: registered } },
  NO_COURSE: { classEnrollments: { none: registered } },
  UNVERIFIED: { email: { not: null }, emailVerifiedAt: null },
  WAITING: {
    waitlist: {
      some: { status: { in: [Enums.WaitlistStatus.WAITING, Enums.WaitlistStatus.OFFERED] } },
    },
  },
};
/** Lọc đăng ký khoá trước phân trang; không trả thông tin gói tự tập. */
export const list = async (query) => {
  const where = {
    role: { isDefault: true },
    ...filters[query.courseFilter],
    ...(query.search && {
      OR: ['fullName', 'email', 'phone'].map((field) => ({ [field]: { contains: query.search } })),
    }),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        ...USER_WITH_ROLE,
        classEnrollments: {
          where: registered,
          orderBy: { enrolledAt: 'desc' },
          take: 1,
          include: { gymClass: { select: { id: true, name: true } } },
        },
        _count: { select: { classEnrollments: { where: registered } } },
      },
      orderBy: { id: 'desc' },
      ...toPrismaPage(query),
    }),
    prisma.user.count({ where }),
  ]);
  const items = users.map(({ classEnrollments, _count, ...user }) => ({
    ...toPublicUser(user),
    activeCourseCount: _count.classEnrollments,
    latestCourse: classEnrollments[0]?.gymClass ?? null,
  }));
  return { items, meta: buildPageMeta({ ...query, total }) };
};
