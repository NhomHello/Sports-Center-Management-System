import { randomUUID } from 'node:crypto';
import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, TIME, VALIDATION } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { INVOICE_INCLUDE } from '../payment/invoice.service.js';

/** BR-1.13: khóa theo hội viên và tái sử dụng hóa đơn PENDING, giá lấy từ DB. */
export const createCounterOrder = async ({ memberId, planId }, actor) => {
  const prefix = await settingService.getValue(SETTING_KEYS.INVOICE_CODE_PREFIX);
  const timeout = await settingService.getValue(SETTING_KEYS.PAYMENT_ONLINE_TIMEOUT_MINUTES);
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${memberId} FOR UPDATE`;
      const member = await tx.user.findFirst({
        where: { id: memberId, role: { isDefault: true }, status: Enums.UserStatus.ACTIVE },
      });
      if (!member) throw ApiError.notFound('Không tìm thấy hội viên đang hoạt động');
      const plan = await tx.membershipPlan.findUnique({ where: { id: planId } });
      if (!plan) throw ApiError.notFound('Không tìm thấy gói tập');
      if (!plan.isActive) throw ApiError.businessRule('Gói tập đã ngừng bán');
      if (plan.price <= 0 || plan.durationDays <= 0)
        throw ApiError.businessRule('Giá hoặc thời hạn gói chưa hợp lệ');
      const pending = await tx.invoice.findFirst({
        where: { userId: memberId, planId, status: Enums.InvoiceStatus.PENDING },
        include: INVOICE_INCLUDE,
      });
      if (pending?.channel === Enums.InvoiceChannel.COUNTER) return pending;
      if (pending)
        throw ApiError.conflict(
          'Gói này đang có hóa đơn online chờ thanh toán. Cần xử lý hóa đơn đó trước.',
        );
      const created = await tx.invoice.create({
        data: {
          code: `PENDING-${randomUUID()}`,
          userId: memberId,
          planId,
          planName: plan.name,
          durationDays: plan.durationDays,
          amount: plan.price,
          channel: Enums.InvoiceChannel.COUNTER,
          expiresAt: new Date(Date.now() + timeout * TIME.MS_PER_MINUTE),
        },
      });
      const invoice = await tx.invoice.update({
        where: { id: created.id },
        data: {
          code: `${prefix}${String(created.id).padStart(VALIDATION.INVOICE_SEQUENCE_WIDTH, '0')}`,
        },
        include: INVOICE_INCLUDE,
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: AUDIT_ACTIONS.CREATE,
          entity: ENTITIES.INVOICE,
          entityId: String(invoice.id),
          meta: { memberId, planId, amount: invoice.amount, channel: invoice.channel },
        },
      });
      return invoice;
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
};

/** BR-1.3/1.4: còn hạn cộng từ cuối gói; hết hạn bắt đầu tại ngày thu tiền. */
export const activatePaidInvoice = async (invoice, paidAt, tx) => {
  await tx.membership.updateMany({
    where: {
      userId: invoice.userId,
      status: Enums.MembershipStatus.ACTIVE,
      endDate: { lte: paidAt },
    },
    data: { status: Enums.MembershipStatus.EXPIRED, activeUserId: null },
  });
  const current = await tx.membership.findFirst({
    where: {
      userId: invoice.userId,
      status: Enums.MembershipStatus.ACTIVE,
      endDate: { gt: paidAt },
    },
  });
  const startDate = current?.startDate ?? paidAt;
  const endDate = new Date(
    (current?.endDate ?? paidAt).getTime() +
      (invoice.durationDays ?? invoice.plan.durationDays) * TIME.MS_PER_DAY,
  );
  const data = {
    planId: invoice.planId,
    startDate,
    endDate,
    activeUserId: invoice.userId,
    status: Enums.MembershipStatus.ACTIVE,
  };
  const membership = current
    ? await tx.membership.update({ where: { id: current.id }, data, include: { plan: true } })
    : await tx.membership.create({
        data: { ...data, userId: invoice.userId },
        include: { plan: true },
      });
  await tx.invoice.update({ where: { id: invoice.id }, data: { membershipId: membership.id } });
  return membership;
};
