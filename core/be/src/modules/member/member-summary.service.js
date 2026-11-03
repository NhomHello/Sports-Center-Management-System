import { prisma, Enums } from '../../config/db.js';
/** Tổng quan dựa trên tài khoản, đăng ký khoá và hàng chờ, không dựa vào kỳ gói. */
export const summary = async () => {
  const [active, enrolled, waiting] = await prisma.$transaction([
    prisma.user.count({ where: { status: Enums.UserStatus.ACTIVE, role: { isDefault: true } } }),
    prisma.user.count({
      where: {
        role: { isDefault: true },
        classEnrollments: {
          some: {
            status: Enums.EnrollmentStatus.BOOKED,
            gymClass: { status: { in: [Enums.ClassStatus.OPEN, Enums.ClassStatus.CLOSED] } },
          },
        },
      },
    }),
    prisma.classWaitlist.count({
      where: { status: { in: [Enums.WaitlistStatus.WAITING, Enums.WaitlistStatus.OFFERED] } },
    }),
  ]);
  return { active, enrolled, waiting };
};
