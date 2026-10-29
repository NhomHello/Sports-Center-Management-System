import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { withScheduleTransaction } from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { ACCESS_INCLUDE, toPlanView } from '../membership-plan/membership-plan.service.js';
import { completeDueFreezes, freezeBudget } from './membership-freeze.service.js';
import { LIVE_STATUSES } from './membership-period.service.js';

const PERIOD_INCLUDE = Object.freeze({
  plan: { include: ACCESS_INCLUDE },
  freezes: { orderBy: { startAt: 'desc' } },
});

/** Một kỳ gói kèm khung giờ/khu vực của gói và ngân sách bảo lưu (GY-20, GY-40). */
const toPeriodView = async (item) => {
  const plan = toPlanView(item.plan);
  return {
    ...item,
    plan,
    frames: plan.frames,
    areas: plan.areas,
    isFrozen: item.status === Enums.MembershipStatus.FROZEN,
    ...(await freezeBudget(item)),
  };
};

const loadPeriods = (db, memberId) =>
  db.membership.findMany({
    where: { userId: memberId },
    include: PERIOD_INCLUDE,
    orderBy: { startDate: 'asc' },
  });

/**
 * Kỳ đang hiệu lực của hội viên (hoặc kỳ gần nhất đã kết thúc) cùng các kỳ đã mua nối tiếp.
 * Trạng thái được đồng bộ (bảo lưu, hết hạn, tới lượt kỳ sau) trước khi đọc.
 * @param {number} memberId
 * @returns {Promise<object|null>}
 */
export const getCurrentByMemberId = async (memberId) => {
  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
  return withScheduleTransaction(async (db) => {
    const current = await completeDueFreezes(db, memberId, new Date());
    const periods = await loadPeriods(db, memberId);
    const shown =
      periods.find((p) => p.id === current?.id) ??
      periods.filter((p) => p.status !== Enums.MembershipStatus.CANCELLED).at(-1);
    if (!shown) return null;
    const nextPeriods = periods.filter(
      (p) =>
        p.id !== shown.id && LIVE_STATUSES.includes(p.status) && p.startDate >= shown.startDate,
    );
    const paidInvoiceCount = await db.invoice.count({
      where: {
        userId: memberId,
        kind: Enums.InvoiceKind.MEMBERSHIP,
        status: Enums.InvoiceStatus.PAID,
      },
    });
    return {
      ...(await toPeriodView(shown)),
      nextPeriods: nextPeriods.map(({ freezes: _f, ...period }) => period),
      paidInvoiceCount,
    };
  });
};

/**
 * Chi tiết một kỳ gói: chủ kỳ hoặc nhân viên có quyền xem mọi gói.
 * @param {number} id
 * @param {{ user: { id: number }, permissions: Set<string> }} context
 */
export const getPeriod = async (id, context) => {
  const item = await prisma.membership.findUnique({ where: { id } });
  if (!item) throw ApiError.notFound('Không tìm thấy kỳ gói');
  if (item.userId !== context.user.id && !context.permissions.has(P.MEMBERSHIP_READ_ALL))
    throw ApiError.forbidden();
  return withScheduleTransaction(async (db) => {
    await completeDueFreezes(db, item.userId, new Date());
    return toPeriodView(await db.membership.findUnique({ where: { id }, include: PERIOD_INCLUDE }));
  });
};
