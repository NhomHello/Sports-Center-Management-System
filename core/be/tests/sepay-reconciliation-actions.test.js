import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
import { toWebhookPayload } from '../src/modules/reconciliation/sepay-sync.service.js';
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
const DAY = 24 * 3600 * 1000;
let f;

const freshInvoice = async (token = f.memberToken, userId = f.member.id) => {
  await prisma.membership.deleteMany({ where: { userId } });
  await prisma.invoice.updateMany({
    where: { userId, status: Enums.InvoiceStatus.PENDING },
    data: { status: Enums.InvoiceStatus.FAILED },
  });
  return buyOnline(f, token);
};
const expireNow = (invoiceId) =>
  prisma.invoice.update({
    where: { id: invoiceId },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
const claim = (invoiceId, token = f.memberToken, amount = 300000) =>
  api
    .post(apiPath(`/invoices/${invoiceId}/claims`))
    .set(bearer(token))
    .send({ transferredAt: new Date(), amount, bankName: 'ACB', reference: 'FT-CLAIM' });

beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(() => cleanupReconciliationFixture(f));

describe('Map giao dịch sai mã và tiền về muộn (UC-PAY-11)', () => {
  it('không có mã ⇒ NO_MATCH; map vào hội viên + gói ⇒ tạo hoá đơn và PAID', async () => {
    await freshInvoice();
    const res = await sendTransfer(f, null, { transferAmount: 300000, content: 'nguyen van a' });
    expect(res.reason).toBe(REASON.NO_MATCH);
    const log = await prisma.paymentWebhookLog.findFirstOrThrow({
      where: { providerTransactionId: f.sepayIds.at(-1) },
    });
    const kase = await latestCase(f, { webhookLogId: log.id });
    const mapped = await asManager(f, 'post', `/reconciliations/${kase.id}/map`, {
      memberId: f.member.id,
      planId: f.plan.id,
    });
    expect(mapped.body.data).toMatchObject({ status: STATUS.MATCHED, outcome: 'PAID' });
    const again = await asManager(f, 'post', `/reconciliations/${kase.id}/map`, {
      memberId: f.member.id,
      planId: f.plan.id,
    });
    expect(again.status).toBe(409);
    const detail = await asManager(f, 'get', `/reconciliations/${kase.id}`);
    expect(detail.body.data.invoice.status).toBe(Enums.InvoiceStatus.PAID);
  });

  it('hoá đơn đã hết hạn rồi tiền mới về ⇒ LATE; map lại đúng hoá đơn ⇒ PAID', async () => {
    const invoice = await freshInvoice(f.otherToken, f.other.id);
    await expireNow(invoice.id);
    expect(await expireOverdueInvoices()).toBeGreaterThanOrEqual(1);
    const failed = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(failed.status).toBe(Enums.InvoiceStatus.FAILED);
    const expiredNotice = await prisma.notification.count({
      where: { userId: f.other.id, kind: 'INVOICE_EXPIRED' },
    });
    expect(expiredNotice).toBe(1);

    expect((await sendTransfer(f, invoice)).reason).toBe(REASON.LATE);
    const kase = await latestCase(f, { invoiceId: invoice.id, reason: REASON.LATE });
    const mapped = await asManager(f, 'post', `/reconciliations/${kase.id}/map`, {
      invoiceId: invoice.id,
    });
    expect(mapped.body.data.status).toBe(STATUS.MATCHED);
  });

  it('chỉ bỏ qua được giao dịch không gắn hội viên và phải có ghi chú', async () => {
    await sendTransfer(f, null, { transferAmount: 1000, content: 'test' });
    const log = await prisma.paymentWebhookLog.findFirstOrThrow({
      where: { providerTransactionId: f.sepayIds.at(-1) },
    });
    const kase = await latestCase(f, { webhookLogId: log.id });
    const empty = await asManager(f, 'post', `/reconciliations/${kase.id}/ignore`, { note: '' });
    expect(empty.status).toBe(400);
    const ok = await asManager(f, 'post', `/reconciliations/${kase.id}/ignore`, {
      note: 'Giao dịch thử của kế toán',
    });
    expect(ok.body.data.status).toBe(STATUS.IGNORED);
  });
});

describe('Hội viên báo đã chuyển khoản (UC-PAY-14)', () => {
  it('mở phiếu MEMBER_CLAIM; không gửi trùng; người khác nhận 404; xác nhận ⇒ PAID', async () => {
    const invoice = await freshInvoice();
    const created = await claim(invoice.id);
    expect(created.status).toBe(201);
    f.caseIds.push(created.body.data.id);
    expect((await claim(invoice.id)).status).toBe(409);
    expect((await claim(invoice.id, f.otherToken)).status).toBe(404);
    const still = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(still.status).toBe(Enums.InvoiceStatus.PENDING);

    const id = created.body.data.id;
    const rejectNoContact = await asManager(f, 'post', `/reconciliations/${id}/reject`, {
      note: 'Không thấy giao dịch',
    });
    expect(rejectNoContact.status).toBe(422);
    const confirmInput = { amount: 300000, reference: 'FT-SAO-KE-01' };
    // BR-PAY-19: xác nhận cũng như từ chối, phải có lần liên hệ hội viên được ghi lại.
    const confirmNoContact = await asManager(
      f,
      'post',
      `/reconciliations/${id}/confirm`,
      confirmInput,
    );
    expect(confirmNoContact.status).toBe(422);
    await asManager(f, 'post', `/reconciliations/${id}/contacts`, {
      channel: 'PHONE',
      content: 'Đã đối chiếu sao kê với hội viên',
    });
    const confirmed = await asManager(f, 'post', `/reconciliations/${id}/confirm`, confirmInput);
    expect(confirmed.body.data).toMatchObject({ status: STATUS.MATCHED, outcome: 'PAID' });
  });

  it('từ chối phiếu sau khi đã liên hệ và báo lý do cho hội viên', async () => {
    const invoice = await freshInvoice(f.otherToken, f.other.id);
    const { body } = await claim(invoice.id, f.otherToken);
    f.caseIds.push(body.data.id);
    await asManager(f, 'post', `/reconciliations/${body.data.id}/contacts`, {
      channel: 'ZALO',
      content: 'Nhờ gửi biên lai',
    });
    const rejected = await asManager(f, 'post', `/reconciliations/${body.data.id}/reject`, {
      note: 'Không có giao dịch trên sao kê',
    });
    expect(rejected.body.data.status).toBe(STATUS.REJECTED);
    const notice = await prisma.notification.findFirst({
      where: { userId: f.other.id, kind: 'PAYMENT_CLAIM_REJECTED' },
    });
    expect(notice.message).toContain('Không có giao dịch trên sao kê');
  });
});

describe('Hết hạn chuyển bù, hoàn hoá đơn, phân quyền', () => {
  it('quá hạn chuyển bù ⇒ hoá đơn FAILED, phiếu chờ hoàn số đã nhận', async () => {
    const invoice = await freshInvoice();
    await sendTransfer(f, invoice, { transferAmount: 120000 });
    const kase = await latestCase(f, { invoiceId: invoice.id, reason: REASON.UNDERPAID });
    await expireNow(invoice.id);
    await expireOverdueInvoices();
    const after = await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: kase.id } });
    expect(after.status).toBe(STATUS.REFUND_PENDING);
    const refund = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
      reason: 'Quá hạn chuyển bù',
    });
    expect(refund.body.data.amount).toBe(120000);
  });

  it('hoàn hoá đơn PAID ⇒ REFUNDED và rút đúng số ngày khỏi gói', async () => {
    const invoice = await freshInvoice(f.otherToken, f.other.id);
    await sendTransfer(f, invoice);
    const active = await prisma.membership.findFirstOrThrow({ where: { userId: f.other.id } });
    const res = await asManager(f, 'post', `/invoices/${invoice.id}/refund`, {
      reason: 'Trung tâm không xếp được lớp',
    });
    expect(res.status).toBe(201);
    const refunded = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(refunded.status).toBe(Enums.InvoiceStatus.REFUNDED);
    // GY-20: hoàn cả hóa đơn thì kỳ gói của hóa đơn đó bị hủy (không còn ngày nào để dùng).
    const revoked = await prisma.membership.findUniqueOrThrow({ where: { id: active.id } });
    expect(revoked.status).toBe(Enums.MembershipStatus.CANCELLED);
    expect(revoked.activeUserId).toBeNull();
    const twice = await asManager(f, 'post', `/invoices/${invoice.id}/refund`, { reason: 'Lần 2' });
    expect(twice.status).toBe(409);
  });

  it('hội viên không vào được hàng chờ đối soát; hoá đơn giữ giá đã chốt khi đổi giá gói', async () => {
    const forbidden = await api.get(apiPath('/reconciliations')).set(bearer(f.memberToken));
    expect(forbidden.status).toBe(403);
    const invoice = await freshInvoice();
    await prisma.membershipPlan.update({ where: { id: f.plan.id }, data: { price: 999000 } });
    const res = await sendTransfer(f, invoice, { transferAmount: 300000 });
    await prisma.membershipPlan.update({ where: { id: f.plan.id }, data: { price: 300000 } });
    expect(res.outcome).toBe('PAID');
  });

  it('đồng bộ SePay: chưa cấu hình token thì báo rõ; chuyển đúng định dạng giao dịch', async () => {
    const res = await asManager(f, 'post', '/reconciliations/sync', {
      from: new Date(Date.now() - DAY),
      to: new Date(),
    });
    expect(res.status).toBe(422);
    const payload = toWebhookPayload({
      id: 92704,
      amount_in: '2277000.00',
      amount_out: '0.00',
      transaction_content: 'INV000123 thanh toan',
      reference_number: 'MBVCB.123',
      code: null,
    });
    expect(payload).toMatchObject({ id: '92704', transferType: 'in', transferAmount: 2277000 });
  });
});
