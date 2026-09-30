import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';

/**
 * Lấy membership hiện tại hoặc gần nhất của hội viên.
 * @param {number} memberId
 * @returns {Promise<object|null>}
 */
export const getCurrentByMemberId = async (memberId) => {
  const member = await prisma.user.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound('Không tìm thấy hội viên');
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: memberId,
    },
    include: {
      plan: true,
    },
    orderBy: {
      endDate: 'desc',
    },
  });

  if (!membership) {
    return null;
  }

  const now = new Date();

  return {
    ...membership,
    status: membership.endDate >= now ? 'ACTIVE' : 'EXPIRED',
  };
};
