import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import {
  asManager,
  buyOnline,
  cleanupReconciliationFixture,
  createReconciliationFixture,
  latestCase,
  sendTransfer,
} from './helpers/reconciliation.js';

const { ReconciliationReason: REASON, ReconciliationStatus: STATUS } = Enums;
let f;

const resetMember = (userId) =>
  prisma.membership.deleteMany({ where: { userId } }).then(() =>
    prisma.invoice.updateMany({
      where: { userId, status: Enums.InvoiceStatus.PENDING },
      data: { status: Enums.InvoiceStatus.FAILED },
    }),
  );
const contact = (id) =>
  asManager(f, 'post', `/reconciliations/${id}/contacts`, {
    channel: 'PHONE',
    content: 'Đã gọi hội viên',
    result: 'Hội viên đồng ý',
  });

beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(() => cleanupReconciliationFixture(f));

describe('Đối soát SePay: thiếu tiền và chuyển bù (UC-PAY-12)', () => {
  it('chuyển thiếu ⇒ giữ PENDING, phiếu chờ chuyển bù; chuyển bù đủ ⇒ PAID và đóng phiếu', async () => {
    await resetMember(f.member.id);
    const invoice = await buyOnline(f);
    const first = await sendTransfer(f, invoice, { transferAmount: 100000 });
    expect(first).toMatchObject({ status: 'NEEDS_REVIEW', outcome: 'UNDERPAID' });
    const waiting = await latestCase(f, { invoiceId: invoice.id });
    expect(waiting).toMatchObject({ reason: REASON.UNDERPAID, status: STATUS.WAITING_TOPUP });
    const pending = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(pending.status).toBe(Enums.InvoiceStatus.PENDING);
    expect(pending.expiresAt.getTime()).toBeGreaterThan(new Date(invoice.expiresAt).getTime());

    const notice = await prisma.notification.findFirst({
      where: { userId: f.member.id, kind: 'PAYMENT_TOPUP_REQUIRED' },
    });
    expect(notice.title).toContain('200.000');

    const topup = await sendTransfer(f, invoice, { transferAmount: 200000 });
    expect(topup).toMatchObject({ status: 'PROCESSED', outcome: 'PAID' });
    const paid = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { payments: true },
    });
    expect(paid.status).toBe(Enums.InvoiceStatus.PAID);
    expect(paid.payments.map((item) => item.receivedAmount).sort()).toEqual([100000, 200000]);
    const closed = await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: waiting.id } });
    expect(closed.status).toBe(STATUS.MATCHED);

    const list = await api
      .get(apiPath('/invoices/me'))
      .set(bearer(f.memberToken))
      .query({ status: 'PAID' });
    expect(list.body.data.find((item) => item.id === invoice.id).receivedAmount).toBe(300000);
  });

  it('chuyển bù nhiều lần vẫn thiếu chỉ giữ một phiếu UNDERPAID', async () => {
    await resetMember(f.other.id);
    const invoice = await buyOnline(f, f.otherToken);
    await sendTransfer(f, invoice, { transferAmount: 50000 });
    await sendTransfer(f, invoice, { transferAmount: 50000 });
    const count = await prisma.reconciliationCase.count({
      where: { invoiceId: invoice.id, reason: REASON.UNDERPAID },
    });
    expect(count).toBe(1);
    await latestCase(f, { invoiceId: invoice.id });
  });
});

describe('Đối soát SePay: thừa tiền và chuyển lặp (UC-PAY-11, 13)', () => {
  it('chuyển thừa ⇒ PAID + phiếu OVERPAID; hoàn phần thừa cần liên hệ trước', async () => {
    await resetMember(f.member.id);
    const invoice = await buyOnline(f);
    const res = await sendTransfer(f, invoice, { transferAmount: 350000 });
    expect(res.outcome).toBe('OVERPAID');
    const kase = await latestCase(f, { invoiceId: invoice.id, reason: REASON.OVERPAID });
    expect(kase.excessAmount).toBe(50000);

    const blocked = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
      reason: 'Hoàn phần thừa',
    });
    expect(blocked.status).toBe(422);
    expect((await contact(kase.id)).status).toBe(201);
    const refund = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
      reason: 'Hoàn phần thừa',
      amount: 60000,
    });
    expect(refund.status).toBe(422);
    const ok = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
      reason: 'Hoàn phần thừa',
    });
    expect(ok.body.data.amount).toBe(50000);
    const done = await asManager(f, 'post', `/refunds/${ok.body.data.id}/complete`, {
      reference: 'FT-HOAN-01',
    });
    expect(done.body.data.status).toBe('DONE');
    const refunded = await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: kase.id } });
    expect(refunded.status).toBe(STATUS.REFUNDED);
    const still = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(still.status).toBe(Enums.InvoiceStatus.PAID);
  });

  it('chuyển 2 lần cùng mã ⇒ cảnh báo DUPLICATE, không tự gia hạn; dùng khoản lặp để gia hạn', async () => {
    await resetMember(f.other.id);
    const invoice = await buyOnline(f, f.otherToken);
    await sendTransfer(f, invoice);
    const before = await prisma.membership.findFirstOrThrow({ where: { userId: f.other.id } });
    const dup = await sendTransfer(f, invoice);
    expect(dup).toMatchObject({ status: 'NEEDS_REVIEW', reason: REASON.DUPLICATE_TRANSFER });
    const kase = await latestCase(f, { invoiceId: invoice.id, reason: REASON.DUPLICATE_TRANSFER });
    const same = await prisma.membership.findFirstOrThrow({ where: { userId: f.other.id } });
    expect(same.endDate).toEqual(before.endDate);
    const memberAlert = await prisma.notification.count({
      where: { userId: f.other.id, kind: 'PAYMENT_REVIEW_ALERT' },
    });
    expect(memberAlert).toBe(1);
    const summary = await asManager(f, 'get', '/reconciliations/summary');
    expect(summary.body.data.duplicate).toBeGreaterThanOrEqual(1);

    const noContact = await asManager(f, 'post', `/reconciliations/${kase.id}/renew`, {
      planId: f.renewal.id,
    });
    expect(noContact.status).toBe(422);
    await contact(kase.id);
    const renewed = await asManager(f, 'post', `/reconciliations/${kase.id}/renew`, {
      planId: f.renewal.id,
    });
    expect(renewed.body.data).toMatchObject({ status: STATUS.MATCHED, outcome: 'PAID' });
    const after = await prisma.membership.findFirstOrThrow({ where: { userId: f.other.id } });
    expect(after.endDate.getTime() - before.endDate.getTime()).toBe(10 * 24 * 3600 * 1000);
  });
});
