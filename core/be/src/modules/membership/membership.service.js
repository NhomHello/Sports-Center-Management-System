import { MembershipPlanStatus } from '@prisma/client';
import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';

const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
});

/**
 * Cộng số ngày của gói vào một ngày cho trước.
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

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
  const status = membership.endDate >= now ? MEMBERSHIP_STATUS.ACTIVE : MEMBERSHIP_STATUS.EXPIRED;

  return {
    ...membership,
    status,
  };
};

/**
 * Mua hoặc gia hạn gói cho hội viên.
 * BR-1.3: còn hạn thì cộng thời hạn mới vào ngày hết hạn hiện tại.
 * BR-1.4: hết hạn thì ngày bắt đầu mới là ngày thanh toán.
 * @param {{ memberId: number, planId: number, paidAt: Date }} data
 * @returns {Promise<object>}
 */
export const purchaseOrRenew = async ({ memberId, planId, paidAt }) => {
  const member = await prisma.user.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw ApiError.notFound('Không tìm thấy hội viên');
  }

  const plan = await prisma.membershipPlan.findFirst({
    where: {
      id: planId,
      status: MembershipPlanStatus.SELLING,
    },
  });

  if (!plan) {
    throw ApiError.businessRule('Gói tập không còn được bán');
  }

  const currentMembership = await findLatestByMemberId(memberId);

  if (currentMembership && currentMembership.endDate >= paidAt) {
    const endDate = addDays(currentMembership.endDate, plan.durationDays);

    return prisma.membership.update({
      where: {
        id: currentMembership.id,
      },
      data: {
        planId,
        endDate,
      },
      include: {
        plan: true,
      },
    });
  }

  return prisma.membership.create({
    data: {
      userId: memberId,
      planId,
      startDate: paidAt,
      endDate: addDays(paidAt, plan.durationDays),
    },
    include: {
      plan: true,
    },
  });
};
