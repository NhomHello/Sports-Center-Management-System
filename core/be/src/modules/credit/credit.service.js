import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';

/**
 * Ghi một biến động số dư (+ vào, − ra) và cập nhật số dư cache trên user dưới khoá hàng user.
 * Sổ chỉ thêm, không sửa/xoá; số dư không bao giờ âm.
 * @param {object} tx
 * @param {{ userId: number, amount: number, reason: string, actorId: number, invoiceId?: number, changeId?: number, note?: string }} entry
 */
export const addCredit = async (tx, entry) => {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${entry.userId} FOR UPDATE`;
  const user = await tx.user.findUniqueOrThrow({ where: { id: entry.userId } });
  const balanceAfter = user.creditBalance + entry.amount;
  if (balanceAfter < 0) throw ApiError.businessRule('Số dư tài khoản không đủ');
  await tx.user.update({ where: { id: user.id }, data: { creditBalance: balanceAfter } });
  const row = await tx.creditTransaction.create({
    data: {
      userId: entry.userId,
      amount: entry.amount,
      balanceAfter,
      reason: entry.reason,
      invoiceId: entry.invoiceId ?? null,
      changeId: entry.changeId ?? null,
      note: entry.note ?? null,
      actorId: entry.actorId,
    },
  });
  await tx.auditLog.create({
    data: {
      userId: entry.actorId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: ENTITIES.USER,
      entityId: String(entry.userId),
      meta: { credit: entry.amount, balanceAfter, reason: entry.reason, creditId: row.id },
    },
  });
  return row;
};

/**
 * Số dư và sổ biến động của một hội viên, mới nhất trước.
 * @param {number} userId
 * @param {{ page: number, pageSize: number }} query
 */
export const getCredit = async (userId, query) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Không tìm thấy hội viên');
  const where = { userId };
  const [items, total] = await prisma.$transaction([
    prisma.creditTransaction.findMany({
      where,
      include: {
        invoice: { select: { id: true, code: true } },
        actor: { select: { id: true, fullName: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.creditTransaction.count({ where }),
  ]);
  return { balance: user.creditBalance, items, meta: buildPageMeta({ ...query, total }) };
};

/**
 * Hoá đơn không hoàn tất (hết hạn / huỷ) mà đã trừ số dư: trả lại đúng phần số dư đã dùng và ghi
 * một khoản hoàn đã xong để tổng thực nhận của hoá đơn không còn tính phần đó.
 */
export const restoreCreditPayments = async (tx, invoice, actorId) => {
  const used = await tx.payment.aggregate({
    where: { invoiceId: invoice.id, provider: Enums.PaymentProvider.CREDIT },
    _sum: { receivedAmount: true },
  });
  const restored = await tx.creditTransaction.aggregate({
    where: { invoiceId: invoice.id, reason: Enums.CreditReason.ADJUSTMENT, amount: { gt: 0 } },
    _sum: { amount: true },
  });
  const amount = (used._sum.receivedAmount ?? 0) - (restored._sum.amount ?? 0);
  if (amount <= 0) return 0;
  const actor = actorId ?? invoice.userId;
  await addCredit(tx, {
    userId: invoice.userId,
    amount,
    reason: Enums.CreditReason.ADJUSTMENT,
    invoiceId: invoice.id,
    note: `Trả lại số dư đã dùng cho hoá đơn ${invoice.code}`,
    actorId: actor,
  });
  await tx.refund.create({
    data: {
      invoiceId: invoice.id,
      amount,
      reason: 'Trả lại số dư tài khoản',
      status: Enums.RefundStatus.DONE,
      reference: 'CREDIT',
      requestedById: actor,
      completedById: actor,
      completedAt: new Date(),
    },
  });
  return amount;
};
