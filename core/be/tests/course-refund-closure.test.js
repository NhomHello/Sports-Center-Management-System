import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  sendTransfer,
  asManager,
} from './helpers/reconciliation.js';
import { boundaryInvoice, contactCase } from './helpers/payment-deadline.js';
import { fundedCases, requestRefund, finishRefund } from './helpers/payment-resolution.js';
let f;
beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(async () => cleanupReconciliationFixture(f));

describe('TC-PAY-CLOSE: hoàn tiền phải đóng đúng phiếu và không hoàn hai lần', () => {
  it('TC-PAY-CLOSE-01: hai yêu cầu hoàn đồng thời chỉ tạo một lệnh; hoàn tất không lặp được', async () => {
    const invoice = await boundaryInvoice(f);
    await sendTransfer(f, invoice, { transferAmount: 100000 });
    const [kase] = await fundedCases(invoice);
    await contactCase(f, kase.id);
    const requests = await Promise.all(
      [1, 2].map(() =>
        asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
          reason: 'Đồng ý hoàn toàn bộ',
        }),
      ),
    );
    expect(requests.map((r) => r.status).sort()).toEqual([201, 409]);
    const refund = await prisma.refund.findFirstOrThrow({ where: { caseId: kase.id } });
    await finishRefund(f, refund);
    expect(
      (await asManager(f, 'post', `/refunds/${refund.id}/complete`, { reference: 'Lặp' })).status,
    ).toBe(409);
    expect(await prisma.refund.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });
  it('TC-PAY-CLOSE-02: hoàn hết tiền của hóa đơn phải khép các phiếu thiếu/thừa cũ còn treo', async () => {
    const invoice = await boundaryInvoice(f);
    await sendTransfer(f, invoice, { transferAmount: 100000 });
    await sendTransfer(f, invoice, { transferAmount: 250000 });
    const cases = await fundedCases(invoice);
    const under = cases.find((k) => k.reason === 'UNDERPAID');
    const over = cases.find((k) => k.reason === 'OVERPAID');
    // Tái hiện dữ liệu cũ từng để phiếu thiếu tồn tại khi đã chuyển bù thành thừa.
    await prisma.reconciliationCase.update({
      where: { id: under.id },
      data: { status: 'WAITING_TOPUP', resolvedAt: null, resolvedById: null },
    });
    const refund = await requestRefund(f, over);
    expect(refund.amount).toBe(350000);
    expect((await fundedCases(invoice)).find((k) => k.id === under.id).status).toBe(
      'WAITING_TOPUP',
    );
    await finishRefund(f, refund);
    expect((await fundedCases(invoice)).map((k) => k.status)).toEqual(['REFUNDED', 'REFUNDED']);
    const closedLog = await prisma.paymentWebhookLog.findUniqueOrThrow({
      where: { id: under.webhookLogId },
    });
    expect(closedLog.status).toBe('RESOLVED');
  });
  it('TC-PAY-CLOSE-03: hoàn hóa đơn gốc không được đóng khoản khách chuyển lặp chưa hoàn', async () => {
    const invoice = await boundaryInvoice(f);
    await sendTransfer(f, invoice);
    await sendTransfer(f, invoice);
    const duplicate = await prisma.reconciliationCase.findFirstOrThrow({
      where: { invoiceId: invoice.id, reason: 'DUPLICATE_TRANSFER' },
    });
    const original = await asManager(f, 'post', `/invoices/${invoice.id}/refund`, {
      reason: 'Học viên chọn hủy và hoàn khóa',
    });
    expect(original.status).toBe(201);
    await finishRefund(f, original.body.data);
    expect(
      (await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: duplicate.id } })).status,
    ).toBe('OPEN');
    const refund = await requestRefund(f, duplicate);
    expect(refund.amount).toBe(300000);
    await finishRefund(f, refund);
    expect(
      (await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: duplicate.id } })).status,
    ).toBe('REFUNDED');
  });
});

it('TC-PAY-CLOSE-04: có hai khoản hoàn thì không đóng phiếu trước khi khoản cuối được chuyển trả', async () => {
  const invoice = await boundaryInvoice(f);
  await sendTransfer(f, invoice, { transferAmount: 350000 });
  const [over] = await fundedCases(invoice);
  await contactCase(f, over.id);
  expect((await asManager(f, 'post', `/reconciliations/${over.id}/accept`)).status).toBe(200);
  const excessRefund = await requestRefund(f, over);
  expect(excessRefund.amount).toBe(50000);
  const original = await asManager(f, 'post', `/invoices/${invoice.id}/refund`, {
    reason: 'Hoàn khóa sau phần thừa',
  });
  expect(original.status).toBe(201);
  expect(original.body.data.amount).toBe(300000);
  await finishRefund(f, original.body.data);
  expect((await fundedCases(invoice))[0].status).toBe('REFUND_PENDING');
  await finishRefund(f, excessRefund);
  expect((await fundedCases(invoice))[0].status).toBe('REFUNDED');
});
