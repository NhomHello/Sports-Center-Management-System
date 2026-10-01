import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';

const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
});

/**
 * Lấy membership mới nhất của hội viên.
 * @param {number} memberId
 * @returns {Promise<object|null>}
 */
const findLatestByMemberId = async (memberId) =>
  prisma.membership.findFirst({
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

  const membership = await findLatestByMemberId(memberId);

  if (!membership) {
    return null;
  }

  const now = new Date();
  const status = membership.endDate > now ? MEMBERSHIP_STATUS.ACTIVE : MEMBERSHIP_STATUS.EXPIRED;

  return {
    ...membership,
    status,
  };
};
