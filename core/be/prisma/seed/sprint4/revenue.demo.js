import { prisma, Enums } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';

/** 12 tháng có gói/khoá/chênh lệch, kênh thu, CREDIT và hoàn tiền; mã cố định chống tạo trùng. */
export const seedSprint4Revenue = async (catalog, classes) => {
  const today = new Date();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const paidAt = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - offset, 5, 5));
    for (const kind of Object.values(Enums.InvoiceKind)) await seedInvoice(catalog, classes, { offset, paidAt, kind });
  }
};
async function seedInvoice(catalog, classes, { offset, paidAt, kind }) {
  const code = `S4DEMO-${paidAt.toISOString().slice(0, 7)}-${kind}`;
  const amount = { MEMBERSHIP: 450000, COURSE: 900000, ADJUSTMENT: 150000 }[kind];
  const membership = kind === Enums.InvoiceKind.MEMBERSHIP;
  const invoice = await prisma.invoice.upsert({ where: { code }, update: {}, create: {
    code, kind, userId: catalog.members[offset % catalog.members.length].id,
    planId: membership ? catalog.plan.id : null, classId: kind === Enums.InvoiceKind.COURSE ? classes[0].id : null,
    amount, status: Enums.InvoiceStatus.PAID, channel: offset % 2 ? Enums.InvoiceChannel.ONLINE : Enums.InvoiceChannel.COUNTER,
    paidAt, expiresAt: paidAt, durationDays: membership ? 30 : null } });
  await prisma.$transaction(async (db) => {
    await seedPayment(db, invoice, { offset, actorId: catalog.coach.id });
    await seedRefund(db, invoice, { offset, actorId: catalog.coach.id });
    if (membership) await seedPeriod(db, invoice, catalog.plan.id);
  });
}
async function seedPayment(db, invoice, { offset, actorId }) {
  const reference = `S4DEMO-PAY:${invoice.id}`;
  if (await db.payment.findFirst({ where: { reference } })) return;
  const credit = offset === 0 && invoice.kind === Enums.InvoiceKind.MEMBERSHIP ? 50000 : 0;
  await db.payment.create({ data: { invoiceId: invoice.id, requestedAmount: invoice.amount, receivedAmount: invoice.amount - credit,
    provider: offset % 2 ? Enums.PaymentProvider.SEPAY : Enums.PaymentProvider.COUNTER, reference, paidAt: invoice.paidAt, actorId } });
  if (credit) await seedCredit(db, invoice, credit, actorId);
}
async function seedRefund(db, invoice, { offset, actorId }) {
  if (offset % 3 !== 0 || invoice.kind !== Enums.InvoiceKind.COURSE) return;
  if (await db.refund.findFirst({ where: { invoiceId: invoice.id } })) return;
  await db.refund.create({ data: { invoiceId: invoice.id, amount: 100000, reason: 'Hoàn một phần (Demo Sprint 4)',
    status: Enums.RefundStatus.DONE, reference: `S4DEMO-REF:${invoice.id}`, requestedById: actorId,
    completedById: actorId, completedAt: new Date(invoice.paidAt.getTime() + 2 * TIME.MS_PER_DAY) } });
}
async function seedPeriod(db, invoice, planId) {
  const endDate = new Date(invoice.paidAt.getTime() + 30 * TIME.MS_PER_DAY);
  const active = endDate > new Date();
  const period = await db.membership.upsert({ where: { invoiceId: invoice.id }, update: {}, create: {
    invoiceId: invoice.id, userId: invoice.userId, planId, startDate: invoice.paidAt, endDate,
    status: active ? Enums.MembershipStatus.ACTIVE : Enums.MembershipStatus.EXPIRED, activeUserId: active ? invoice.userId : null } });
  await db.invoice.update({ where: { id: invoice.id }, data: { membershipId: period.id } });
}
async function seedCredit(db, invoice, credit, actorId) {
  await db.payment.create({ data: { invoiceId: invoice.id, requestedAmount: invoice.amount, receivedAmount: credit,
    provider: Enums.PaymentProvider.CREDIT, reference: `S4DEMO-CREDIT:${invoice.id}`, paidAt: invoice.paidAt, actorId } });
  await db.creditTransaction.createMany({ data: [
    { userId: invoice.userId, amount: credit, balanceAfter: credit, reason: Enums.CreditReason.ADJUSTMENT, note: 'Số dư demo Sprint 4', actorId, createdAt: invoice.paidAt },
    { userId: invoice.userId, amount: -credit, balanceAfter: 0, reason: Enums.CreditReason.PAYMENT, invoiceId: invoice.id, actorId, createdAt: invoice.paidAt },
  ] });
}
