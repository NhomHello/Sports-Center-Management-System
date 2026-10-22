import { completeDueFreezes } from './membership-freeze.service.js';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, TIME } from '../../constants/index.js';
import { INVOICE_INCLUDE } from '../payment/invoice.service.js';
import { buildPaymentInstruction } from '../payment/sepay-qr.service.js';
import { createInvoiceRecord, loadInvoicePolicy } from '../payment/invoice-create.service.js';
import { nextPeriodStart, syncPeriods } from './membership-period.service.js';

const getSellingPlan = async (tx, planId) => {
  const plan = await tx.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) throw ApiError.notFound('Không tìm thấy gói tập');
  if (!plan.isActive || plan.status !== Enums.MembershipPlanStatus.SELLING) {
    throw ApiError.businessRule('Gói tập đã ngừng bán');
  }
  if (plan.price <= 0 || plan.durationDays <= 0) {
    throw ApiError.businessRule('Giá hoặc thời hạn gói chưa hợp lệ');
  }
  return plan;
};

const expireStalePendingInvoices = async ({ tx, memberId, planId, actorId, now }) => {
  const stale = await tx.invoice.findMany({
    where: {
      userId: memberId,
      planId,
      kind: Enums.InvoiceKind.MEMBERSHIP,
      status: Enums.InvoiceStatus.PENDING,
      // Hoá đơn tại quầy chờ lễ tân thu tiền, không có hạn online (giống job hết hạn).
      channel: Enums.InvoiceChannel.ONLINE,
      expiresAt: { lte: now },
      // Đã nhận một phần tiền thì để job hết hạn xử lý (chuyển phiếu sang chờ hoàn tiền).
      payments: { none: {} },
    },
    select: { id: true },
  });
  if (stale.length === 0) return;
  const ids = stale.map(({ id }) => id);
  await tx.invoice.updateMany({
    where: { id: { in: ids }, status: Enums.InvoiceStatus.PENDING },
    data: { status: Enums.InvoiceStatus.FAILED },
  });
  await tx.auditLog.createMany({
    data: ids.map((id) => ({
      userId: actorId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: ENTITIES.INVOICE,
      entityId: String(id),
      meta: {
        before: { status: Enums.InvoiceStatus.PENDING },
        after: { status: Enums.InvoiceStatus.FAILED },
        reason: 'PAYMENT_TIMEOUT',
      },
    })),
  });
};

const findReusablePending = (tx, memberId, planId, now) =>
  tx.invoice.findFirst({
    where: {
      userId: memberId,
      planId,
      kind: Enums.InvoiceKind.MEMBERSHIP,
      status: Enums.InvoiceStatus.PENDING,
      // Hoá đơn đã nhận tiền (chờ bù / chờ xác nhận chuyển thừa) vẫn là hoá đơn đang xử lý.
      OR: [
        { channel: Enums.InvoiceChannel.COUNTER },
        { expiresAt: { gt: now } },
        { payments: { some: {} } },
      ],
    },
    include: INVOICE_INCLUDE,
  });

const createInvoice = ({ tx, memberId, plan, policy, actorId, now, channel }) =>
  createInvoiceRecord(tx, {
    data: {
      userId: memberId,
      kind: Enums.InvoiceKind.MEMBERSHIP,
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      amount: plan.price,
      channel,
    },
    policy,
    actorId,
    now,
    meta: { planId: plan.id },
  });

const CHANNEL_LABEL = Object.freeze({
  [Enums.InvoiceChannel.COUNTER]: 'tại quầy',
  [Enums.InvoiceChannel.ONLINE]: 'online',
});

/** Khóa theo hội viên, tái sử dụng hóa đơn PENDING cùng kênh và lấy giá từ DB. */
const createOrder = async ({ memberId, planId, channel }, actor) => {
  const policy = await loadInvoicePolicy();
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${memberId} FOR UPDATE`;
      const member = await tx.user.findFirst({
        where: { id: memberId, role: { isDefault: true }, status: Enums.UserStatus.ACTIVE },
      });
      if (!member) throw ApiError.notFound('Không tìm thấy hội viên đang hoạt động');
      const plan = await getSellingPlan(tx, planId);
      const now = new Date();
      await expireStalePendingInvoices({ tx, memberId, planId, actorId: actor.id, now });
      const pending = await findReusablePending(tx, memberId, planId, now);
      if (pending?.channel === channel) return pending;
      if (pending) {
        throw ApiError.conflict(
          `Gói này đang có hóa đơn ${CHANNEL_LABEL[pending.channel]} chờ thanh toán. Cần xử lý hóa đơn đó trước.`,
        );
      }
      return createInvoice({
        tx,
        memberId,
        plan,
        policy,
        actorId: actor.id,
        now,
        channel,
      });
    },
    { isolationLevel: Enums.TransactionIsolationLevel.ReadCommitted },
  );
};

/** Lễ tân tạo hóa đơn tại quầy cho hội viên. */
export const createCounterOrder = (input, actor) =>
  createOrder({ ...input, channel: Enums.InvoiceChannel.COUNTER }, actor);

/** Hội viên tự mua trên web: hóa đơn ONLINE chờ webhook SePay xác nhận. */
export const createOnlineOrder = async (input, actor) => {
  const invoice = await createOrder({ ...input, channel: Enums.InvoiceChannel.ONLINE }, actor);
  return { ...invoice, paymentInstruction: await buildPaymentInstruction(invoice) };
};

/**
 * Mỗi hoá đơn gói đã thanh toán tạo một kỳ gói riêng (GY-20). Còn kỳ đang chạy/mua trước thì kỳ
 * mới nối tiếp sau kỳ muộn nhất (BR-1.3), không thì bắt đầu từ lúc thanh toán (BR-1.4).
 */
export const activatePaidInvoice = async (invoice, paidAt, tx) => {
  await tx.$queryRaw`SELECT id FROM schedule_locks WHERE id = 1 FOR UPDATE`;
  await completeDueFreezes(tx, invoice.userId, paidAt);
  const existing = await tx.membership.findUnique({ where: { invoiceId: invoice.id } });
  if (existing) return existing;
  const startDate = await nextPeriodStart(tx, invoice.userId, paidAt);
  const days = invoice.durationDays ?? invoice.plan.durationDays;
  const membership = await tx.membership.create({
    data: {
      userId: invoice.userId,
      planId: invoice.planId,
      invoiceId: invoice.id,
      startDate,
      endDate: new Date(startDate.getTime() + days * TIME.MS_PER_DAY),
      status: Enums.MembershipStatus.ACTIVE,
    },
    include: { plan: true },
  });
  await tx.invoice.update({ where: { id: invoice.id }, data: { membershipId: membership.id } });
  await syncPeriods(tx, invoice.userId, paidAt);
  return membership;
};
