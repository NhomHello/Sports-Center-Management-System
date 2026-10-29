import { PERMISSIONS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';

const PHONE_VISIBLE_LENGTH = 3;
/** BR-1.1/1.10: chỉ nhân viên có member.read được thấy thẻ hồ sơ trùng. */
export const checkCounterIdentity = async (data, permissions) => {
  const identities = [
    data.email && { email: data.email },
    data.phone && { phone: data.phone },
  ].filter(Boolean);
  const owners = await prisma.user.findMany({
    where: { OR: identities },
    select: {
      id: true,
      fullName: true,
      phone: true,
      status: true,
      memberships: {
        where: { status: { not: Enums.MembershipStatus.CANCELLED } },
        take: 1,
        orderBy: { endDate: 'desc' },
        select: { endDate: true, plan: { select: { name: true } } },
      },
    },
  });
  if (!owners.length) return;
  if (!permissions.has(PERMISSIONS.MEMBER_READ))
    throw ApiError.conflict('Email hoặc số điện thoại đã được sử dụng');
  const duplicates = owners.map(({ phone, memberships, ...member }) => ({
    ...member,
    phone: phone ? `*******${phone.slice(-PHONE_VISIBLE_LENGTH)}` : null,
    currentMembership: memberships[0] ?? null,
  }));
  throw ApiError.conflict('Đã có hồ sơ dùng email hoặc số điện thoại này', { duplicates });
};
