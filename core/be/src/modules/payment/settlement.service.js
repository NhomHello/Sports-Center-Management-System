import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';

const addDays = (date, days) => new Date(date.getTime() + days * TIME.MS_PER_DAY);

const activateMembership = async (invoice, paidAt, tx) => {
  const active = await tx.membership.findFirst({
    where: {
      userId: invoice.userId,
      status: Enums.MembershipStatus.ACTIVE,
      endDate: { gt: paidAt },
    },
    orderBy: { endDate: 'desc' },
  });
  if (active) {
    return tx.membership.update({
      where: { id: active.id },
      data: {
        planId: invoice.planId,
        endDate: addDays(active.endDate, invoice.plan.durationDays),
      },
    });
  }
  await tx.membership.updateMany({
    where: { userId: invoice.userId, status: Enums.MembershipStatus.ACTIVE },
    data: { status: Enums.MembershipStatus.EXPIRED },
  });
  return tx.membership.create({
    data: {
      userId: invoice.userId,
      planId: invoice.planId,
      startDate: paidAt,
      endDate: addDays(paidAt, invoice.plan.durationDays),
    },
  });
};

/** Ghi payment, chuyển PAID và kích hoạt/gia hạn membership trong cùng transaction. */
export const settleCounterInvoice = async ({ invoice, receivedAmount, reference, actorId, tx }) => {
  if (invoice.status !== Enums.InvoiceStatus.PENDING) {
    throw ApiError.conflict('Hoá đơn không còn chờ thanh toán');
  }
  if (receivedAmount !== invoice.amount) {
    throw ApiError.businessRule('Số tiền thực thu phải đúng giá gói');
  }
  const paidAt = new Date();
  const changed = await tx.invoice.updateMany({
    where: { id: invoice.id, status: Enums.InvoiceStatus.PENDING },
    data: { status: Enums.InvoiceStatus.PAID, paidAt },
  });
  if (changed.count !== 1) throw ApiError.conflict('Hoá đơn vừa được xử lý');
  const membership = await activateMembership(invoice, paidAt, tx);
  const payment = await tx.payment.create({
    data: {
      invoiceId: invoice.id,
      provider: Enums.PaymentProvider.COUNTER,
      requestedAmount: invoice.amount,
      receivedAmount,
      reference,
      paidAt,
      actorId,
    },
  });
  await tx.invoice.update({ where: { id: invoice.id }, data: { membershipId: membership.id } });
  return { payment, membership };
};
