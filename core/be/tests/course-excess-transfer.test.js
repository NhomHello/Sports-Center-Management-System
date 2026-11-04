import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { sumReceived } from '../src/modules/payment/payment-apply.service.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  sendTransfer,
  asManager,
  createReconciliationCourse,
} from './helpers/reconciliation.js';
import {
  boundaryInvoice,
  contactCase,
  enrollmentFor,
  graceSeconds,
} from './helpers/payment-deadline.js';
import { fundedCases, finishRefund } from './helpers/payment-resolution.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
let f;
beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(async () => cleanupReconciliationFixture(f));
const acceptedExcess = async () => {
  const invoice = await boundaryInvoice(f);
  await sendTransfer(f, invoice, { transferAmount: 350000 });
  const [kase] = await fundedCases(invoice);
  await contactCase(f, kase.id);
  expect((await asManager(f, 'post', `/reconciliations/${kase.id}/accept`)).status).toBe(200);
  return { invoice, kase };
};

describe('TC-PAY-EXCESS: phần thừa chỉ được dùng một lần, không tính thành tiền mới', () => {
  it('TC-PAY-EXCESS-01: điều chuyển phần thừa sang khóa khác và hoàn khóa cũ không hoàn trùng phần đã dùng', async () => {
    const { invoice, kase } = await acceptedExcess();
    const target = await createReconciliationCourse(f, 50000);
    const moved = await asManager(f, 'post', `/reconciliations/${kase.id}/renew`, {
      classId: target.id,
    });
    expect(moved.status).toBe(200);
    expect(moved.body.data.outcome).toBe('PAID');
    expect(await sumReceived(prisma, invoice.id)).toBe(300000);
    const enrollment = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: target.id, memberId: f.member.id } },
    });
    expect(enrollment.status).toBe('BOOKED');
    const targetPayments = await prisma.payment.findMany({
      where: { invoiceId: enrollment.invoiceId },
    });
    expect(targetPayments.map((p) => p.provider)).toEqual(['CREDIT']);
    const cash = await prisma.payment.aggregate({
      where: { invoiceId: { in: [invoice.id, enrollment.invoiceId] }, provider: { not: 'CREDIT' } },
      _sum: { receivedAmount: true },
    });
    expect(cash._sum.receivedAmount).toBe(350000);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(0);
    expect(
      (await asManager(f, 'post', `/reconciliations/${kase.id}/renew`, { classId: target.id }))
        .status,
    ).toBe(409);
    const refunded = await asManager(f, 'post', `/invoices/${invoice.id}/refund`, {
      reason: 'Chỉ hoàn khoản còn thuộc khóa cũ',
    });
    expect(refunded.body.data.amount).toBe(300000);
    await finishRefund(f, refunded.body.data);
    expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
    expect(
      (await prisma.classEnrollment.findUniqueOrThrow({ where: { id: enrollment.id } })).status,
    ).toBe('BOOKED');
  });
  it('TC-PAY-EXCESS-02: điều chuyển nhưng khóa đích không nhận được thì không mất phần thừa', async () => {
    const { invoice, kase } = await acceptedExcess();
    const rejected = await asManager(f, 'post', `/reconciliations/${kase.id}/renew`, {
      classId: invoice.classId,
    });
    expect(rejected.status).toBe(422);
    expect(await sumReceived(prisma, invoice.id)).toBe(350000);
    expect(await prisma.refund.count({ where: { caseId: kase.id } })).toBe(0);
  });
  it('TC-PAY-EXCESS-03: khóa đích còn thiếu và hết hạn thì số đã điều chuyển quay về số dư, không hoàn bank lần nữa', async () => {
    const { invoice, kase } = await acceptedExcess();
    const target = await createReconciliationCourse(f, 300000);
    const moved = await asManager(f, 'post', `/reconciliations/${kase.id}/renew`, {
      classId: target.id,
    });
    expect(moved.body.data.outcome).toBe('UNDERPAID');
    const enrollment = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: target.id, memberId: f.member.id } },
    });
    const targetInvoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: enrollment.invoiceId },
    });
    await expireOverdueInvoices(
      new Date(targetInvoice.expiresAt.getTime() + (await graceSeconds()) * 1000),
    );
    expect((await enrollmentFor(targetInvoice)).status).toBe('CANCELLED');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(50000);
    expect(await sumReceived(prisma, invoice.id)).toBe(300000);
    expect((await fundedCases(targetInvoice)).map((k) => k.status)).toEqual(['REFUNDED']);
  });
});
