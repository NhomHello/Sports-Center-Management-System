import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  asManager,
  sendTransfer,
} from './helpers/reconciliation.js';
import {
  boundaryInvoice,
  cash,
  enrollmentFor,
  graceSeconds,
  contactCase,
} from './helpers/payment-deadline.js';
import { api, apiPath, bearer } from './helpers/api.js';
let f;
beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(async () => cleanupReconciliationFixture(f));

describe('TC-COUNTER-DEADLINE: thu tại quầy cũng chốt trước hạn trên server', () => {
  it('TC-COUNTER-DEADLINE-01: hết hạn nhưng job chưa chạy vẫn không được thu tiền', async () => {
    const invoice = await boundaryInvoice(f, { channel: 'COUNTER', seconds: -1 });
    expect((await cash(f, invoice)).status).toBe(409);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(0);
    await expireOverdueInvoices();
    expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
  });

  it('TC-COUNTER-DEADLINE-02: thu trong hạn, xác nhận lặp đồng thời chỉ có một khoản thu', async () => {
    const invoice = await boundaryInvoice(f, { channel: 'COUNTER' });
    const results = await Promise.all([cash(f, invoice), cash(f, invoice)]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
    await expireOverdueInvoices(new Date(invoice.expiresAt.getTime() + 1));
    expect((await enrollmentFor(invoice)).status).toBe('BOOKED');
  });

  it('TC-COUNTER-DEADLINE-03: số dư không vượt được hạn, khoản trừ được rollback', async () => {
    const invoice = await boundaryInvoice(f, { seconds: -1 });
    await prisma.user.update({
      where: { id: f.member.id },
      data: { creditBalance: invoice.amount },
    });
    const response = await api
      .post(apiPath(`/invoices/${invoice.id}/apply-credit`))
      .set(bearer(f.memberToken))
      .send({});
    expect(response.status).toBe(409);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(invoice.amount);
    expect(await prisma.creditTransaction.count({ where: { invoiceId: invoice.id } })).toBe(0);
  });

  it('TC-COUNTER-DEADLINE-04: quá hạn giữ chỗ thì hoàn toàn bộ tiền thừa đã nhận, không chỉ phần thừa', async () => {
    const invoice = await boundaryInvoice(f);
    await sendTransfer(f, invoice, { transferAmount: 350000 });
    expect((await cash(f, invoice)).status).toBe(409);
    await expireOverdueInvoices(
      new Date(invoice.expiresAt.getTime() + (await graceSeconds()) * 1000),
    );
    const kase = await prisma.reconciliationCase.findFirstOrThrow({
      where: { invoiceId: invoice.id },
    });
    await contactCase(f, kase.id);
    const refunded = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
      reason: 'Hết hạn giữ chỗ',
    });
    expect(refunded.status).toBe(201);
    expect(refunded.body.data.amount).toBe(350000);
    expect((await enrollmentFor(invoice)).status).toBe('CANCELLED');
    const done = await asManager(f, 'post', `/refunds/${refunded.body.data.id}/complete`, {
      reference: 'BANK-DEADLINE-REFUND',
    });
    expect(done.status).toBe(200);
    expect(
      (await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: kase.id } })).status,
    ).toBe('REFUNDED');
  });
});
