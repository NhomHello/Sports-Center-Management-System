import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  sendTransfer,
} from './helpers/reconciliation.js';
import {
  bankDate,
  boundaryInvoice,
  graceSeconds,
  enrollmentFor,
} from './helpers/payment-deadline.js';
let f;
beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(async () => cleanupReconciliationFixture(f));

describe('TC-PAY-DEADLINE: giờ ngân hàng và khoảng chờ webhook', () => {
  it('TC-PAY-DEADLINE-01: tiền ghi nhận trước hạn, webhook sau hạn vẫn xác nhận trong grace', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -2 });
    await expireOverdueInvoices();
    expect((await enrollmentFor(invoice)).status).toBe('PENDING_PAYMENT');
    const paidAt = new Date(invoice.expiresAt.getTime() - 1000);
    const result = await sendTransfer(f, invoice, { transactionDate: bankDate(paidAt) });
    expect(result.outcome).toBe('PAID');
    expect((await enrollmentFor(invoice)).status).toBe('BOOKED');
    const payment = await prisma.payment.findFirstOrThrow({ where: { invoiceId: invoice.id } });
    expect(payment.paidAt.getTime()).toBeLessThan(invoice.expiresAt.getTime());
  });

  it('TC-PAY-DEADLINE-02: job và webhook cùng chạy trong grace không hủy chỗ đã trả đúng hạn', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -2 });
    const [, result] = await Promise.all([
      expireOverdueInvoices(),
      sendTransfer(f, invoice, {
        transactionDate: bankDate(new Date(invoice.expiresAt.getTime() - 1000)),
      }),
    ]);
    expect(result.outcome).toBe('PAID');
    expect((await enrollmentFor(invoice)).status).toBe('BOOKED');
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });

  it('TC-PAY-DEADLINE-03: giờ ghi nhận sau hạn bị đối soát dù job chưa hủy hóa đơn', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -4 });
    const result = await sendTransfer(f, invoice, {
      transactionDate: bankDate(new Date(invoice.expiresAt.getTime() + 2000)),
    });
    expect(result).toMatchObject({ status: 'NEEDS_REVIEW', reason: 'LATE' });
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(0);
  });

  it('TC-PAY-DEADLINE-04: thiếu/sai/future timestamp sau hạn không tự đoán là thanh toán đúng hạn', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -2 });
    for (const transactionDate of [
      undefined,
      '2026-02-30 00:00:00',
      bankDate(new Date(Date.now() + 60000)),
    ]) {
      const result = await sendTransfer(f, invoice, { transactionDate });
      expect(result).toMatchObject({ status: 'NEEDS_REVIEW', reason: 'LATE' });
    }
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(0);
  });

  it('TC-PAY-DEADLINE-05: hết grace thì FIFO nhận chỗ, webhook trễ không hồi sinh đăng ký', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -(await graceSeconds()) - 2 });
    const waitlist = await prisma.classWaitlist.create({
      data: { classId: invoice.classId, memberId: f.other.id },
    });
    await expireOverdueInvoices();
    expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
    expect(
      (await prisma.classWaitlist.findUniqueOrThrow({ where: { id: waitlist.id } })).status,
    ).toBe('OFFERED');
    const result = await sendTransfer(f, invoice, {
      transactionDate: bankDate(new Date(invoice.expiresAt.getTime() - 1000)),
    });
    expect(result).toMatchObject({ status: 'NEEDS_REVIEW', reason: 'LATE' });
    expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
    await prisma.classWaitlist.delete({ where: { id: waitlist.id } });
  });

  it('TC-PAY-DEADLINE-06: thiếu/thừa vẫn phải hết giữ chỗ, không kéo deadline hoặc giữ vô hạn', async () => {
    for (const amount of [100000, 350000]) {
      const invoice = await boundaryInvoice(f);
      await sendTransfer(f, invoice, { transferAmount: amount });
      const pending = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      expect(pending.expiresAt).toEqual(invoice.expiresAt);
      const afterGrace = new Date(invoice.expiresAt.getTime() + (await graceSeconds()) * 1000);
      await expireOverdueInvoices(afterGrace);
      expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
      expect((await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } })).status).toBe(
        'FAILED',
      );
      const kase = await prisma.reconciliationCase.findFirstOrThrow({
        where: { invoiceId: invoice.id },
      });
      expect(kase.status).toBe('REFUND_PENDING');
    }
  });
});
