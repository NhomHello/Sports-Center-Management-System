import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  sendTransfer,
  asManager,
} from './helpers/reconciliation.js';
import {
  boundaryInvoice,
  graceSeconds,
  enrollmentFor,
  bankDate,
  contactCase,
} from './helpers/payment-deadline.js';
import { fundedCases, requestRefund, finishRefund } from './helpers/payment-resolution.js';
let f;
beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(async () => cleanupReconciliationFixture(f));

describe('TC-PAY-RESOLVE: cộng dồn tiền thiếu/thừa đến kết quả cuối', () => {
  it('TC-PAY-RESOLVE-01: chuyển 100k + 50k + 150k đủ 300k thì vào lớp, hết phiếu thiếu', async () => {
    const invoice = await boundaryInvoice(f);
    for (const amount of [100000, 50000, 150000])
      await sendTransfer(f, invoice, { transferAmount: amount });
    expect((await enrollmentFor(invoice)).status).toBe('BOOKED');
    expect((await fundedCases(invoice)).map((k) => k.status)).toEqual(['MATCHED']);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(3);
  });
  it('TC-PAY-RESOLVE-02: thiếu rồi bù thành thừa: đóng phiếu thiếu, chỉ còn xử lý phần thừa', async () => {
    const invoice = await boundaryInvoice(f);
    await sendTransfer(f, invoice, { transferAmount: 100000 });
    await sendTransfer(f, invoice, { transferAmount: 250000 });
    const cases = await fundedCases(invoice);
    expect(cases.find((k) => k.reason === 'UNDERPAID').status).toBe('MATCHED');
    const excess = cases.find((k) => k.reason === 'OVERPAID');
    expect(excess.excessAmount).toBe(50000);
    expect((await enrollmentFor(invoice)).status).toBe('PENDING_PAYMENT');
    await contactCase(f, excess.id);
    expect((await asManager(f, 'post', `/reconciliations/${excess.id}/accept`)).status).toBe(200);
    const refund = await requestRefund(f, excess);
    expect(refund.amount).toBe(50000);
    await finishRefund(f, refund);
    expect((await enrollmentFor(invoice)).status).toBe('BOOKED');
    expect((await fundedCases(invoice)).map((k) => k.status)).toEqual(['MATCHED', 'REFUNDED']);
  });
  it('TC-PAY-RESOLVE-03: hết hạn còn thiếu thì nhả chỗ và hoàn đúng tổng đã nhận', async () => {
    const invoice = await boundaryInvoice(f);
    await sendTransfer(f, invoice, { transferAmount: 100000 });
    await sendTransfer(f, invoice, { transferAmount: 50000 });
    await expireOverdueInvoices(
      new Date(invoice.expiresAt.getTime() + (await graceSeconds()) * 1000),
    );
    const [kase] = await fundedCases(invoice);
    expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
    const refund = await requestRefund(f, kase);
    expect(refund.amount).toBe(150000);
    expect((await fundedCases(invoice))[0].status).toBe('REFUND_PENDING');
    await finishRefund(f, refund);
    expect((await fundedCases(invoice))[0].status).toBe('REFUNDED');
  });
  it('TC-PAY-RESOLVE-04: bù sau hạn là khoản riêng; hoàn tiền thiếu không được đóng nhầm khoản tiền trễ', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -5 });
    await sendTransfer(f, invoice, {
      transferAmount: 100000,
      transactionDate: bankDate(new Date(invoice.expiresAt.getTime() - 1000)),
    });
    await sendTransfer(f, invoice, {
      transferAmount: 200000,
      transactionDate: bankDate(new Date(invoice.expiresAt.getTime() + 2000)),
    });
    await expireOverdueInvoices(
      new Date(invoice.expiresAt.getTime() + (await graceSeconds()) * 1000),
    );
    const [under] = await fundedCases(invoice);
    const late = await prisma.reconciliationCase.findFirstOrThrow({
      where: { invoiceId: invoice.id, reason: 'LATE' },
    });
    const refund = await requestRefund(f, under);
    expect(refund.amount).toBe(100000);
    await finishRefund(f, refund);
    expect(
      (await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: late.id } })).status,
    ).toBe('OPEN');
    const lateRefund = await requestRefund(f, late);
    expect(lateRefund.amount).toBe(200000);
    await finishRefund(f, lateRefund);
    expect(
      (await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: late.id } })).status,
    ).toBe('REFUNDED');
  });
});
