import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Enums, prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { cleanupSprintFixture, createSprintFixture } from './helpers/sprint1.js';

const WEBHOOK = apiPath('/payments/sepay/webhook');
const auth = { Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` };
let fixture;
let plan;
const sepayIds = [];

const newSepayId = () => {
  const id = String(Date.now()) + Math.floor(Math.random() * 1000);
  sepayIds.push(id);
  return id;
};
const buy = async (token = fixture.memberToken) =>
  (await api.post(apiPath('/memberships/me/orders')).set(bearer(token)).send({ planId: plan.id }))
    .body.data;
const send = (body, headers = auth) => api.post(WEBHOOK).set(headers).send(body);
const transfer = (invoice, overrides = {}) => ({
  id: newSepayId(),
  gateway: 'ACB',
  transferType: 'in',
  transferAmount: invoice.amount,
  code: invoice.code,
  content: `Thanh toan ${invoice.code}`,
  referenceCode: `FT${randomUUID().slice(0, 8)}`,
  ...overrides,
});

beforeAll(async () => {
  fixture = await createSprintFixture();
  plan = await prisma.membershipPlan.create({
    data: { code: fixture.prefix, name: fixture.prefix, price: 450000, durationDays: 30 },
  });
});
afterAll(async () => {
  await prisma.reconciliationCase.deleteMany({
    where: { webhookLog: { providerTransactionId: { in: sepayIds } } },
  });
  await prisma.paymentWebhookLog.deleteMany({ where: { providerTransactionId: { in: sepayIds } } });
  await prisma.auditLog.deleteMany({
    where: {
      userId: null,
      entity: 'Invoice',
      action: 'PAYMENT',
      createdAt: { gte: new Date(Date.now() - 3600000) },
    },
  });
  await cleanupSprintFixture(fixture);
  await prisma.membershipPlan.deleteMany({ where: { id: plan.id } });
});

describe('SePay webhook', () => {
  it('từ chối thiếu hoặc sai API key', async () => {
    expect((await send({ id: 1 }, {})).status).toBe(401);
    expect((await send({ id: 1 }, { Authorization: 'Apikey sai-key' })).status).toBe(401);
  });

  it('hoá đơn online khớp mã và đúng tiền => PAID, tạo payment SEPAY và kích hoạt gói', async () => {
    const invoice = await buy();
    expect(invoice.channel).toBe(Enums.InvoiceChannel.ONLINE);
    const res = await send(transfer(invoice));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(Enums.WebhookLogStatus.PROCESSED);
    const paid = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { payments: true },
    });
    expect(paid.status).toBe(Enums.InvoiceStatus.PAID);
    expect(paid.payments).toHaveLength(1);
    expect(paid.payments[0].provider).toBe(Enums.PaymentProvider.SEPAY);
    expect(paid.membershipId).not.toBeNull();
    const active = await prisma.membership.findFirstOrThrow({
      where: { userId: fixture.member.id },
    });
    expect(active.status).toBe(Enums.MembershipStatus.ACTIVE);
  });

  it('SePay gửi lại cùng id => không ghi nhận tiền lần hai', async () => {
    const invoice = await buy(fixture.otherToken);
    const body = transfer(invoice);
    await send(body);
    const again = await send(body);
    expect(again.status).toBe(200);
    expect(again.body.data.status).toBe(Enums.WebhookLogStatus.DUPLICATE);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });

  it('tìm được mã trong nội dung khi trường code trống', async () => {
    const invoice = await buy(fixture.otherToken);
    const res = await send(transfer(invoice, { code: null, content: `ck ${invoice.code} cam on` }));
    expect(res.body.data.status).toBe(Enums.WebhookLogStatus.PROCESSED);
  });

  it('sai số tiền => NEEDS_REVIEW, hoá đơn vẫn PENDING', async () => {
    await prisma.membership.deleteMany({ where: { userId: fixture.member.id } });
    const invoice = await buy();
    const res = await send(transfer(invoice, { transferAmount: invoice.amount - 1000 }));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(Enums.WebhookLogStatus.NEEDS_REVIEW);
    const after = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(after.status).toBe(Enums.InvoiceStatus.PENDING);
  });

  it('không có hoá đơn tương ứng và giao dịch tiền ra được ghi log, không lỗi', async () => {
    const unknown = await send({
      id: newSepayId(),
      transferType: 'in',
      transferAmount: 1000,
      code: null,
      content: 'chuyen tien linh tinh',
    });
    expect(unknown.body.data.status).toBe(Enums.WebhookLogStatus.NEEDS_REVIEW);
    const out = await send({ id: newSepayId(), transferType: 'out', transferAmount: 1000 });
    expect(out.body.data.status).toBe(Enums.WebhookLogStatus.IGNORED);
  });

  it('hoá đơn tại quầy không được thanh toán qua webhook', async () => {
    const counter = await api
      .post(apiPath('/memberships/orders'))
      .set(bearer(fixture.adminToken))
      .send({ memberId: fixture.other.id, planId: plan.id });
    // other đã có hoá đơn online cùng gói được xử lý ở trên nên tạo mới được
    const invoice = counter.body.data;
    expect(invoice.channel).toBe(Enums.InvoiceChannel.COUNTER);
    const res = await send(transfer(invoice));
    expect(res.body.data.status).toBe(Enums.WebhookLogStatus.NEEDS_REVIEW);
    const after = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(after.status).toBe(Enums.InvoiceStatus.PENDING);
  });
  it('mua tiếp khi còn hạn thì cộng dồn vào cùng membership và API trả số lần thanh toán', async () => {
    const first = await buy();
    // Hóa đơn PENDING được tái sử dụng; QR có thể null nếu chưa cấu hình ngân hàng.
    // Tính khoản còn thiếu từ payment thực nhận, tránh gửi thừa tiền và mở phiếu đối soát.
    const received = first.payments.reduce((total, payment) => total + payment.receivedAmount, 0);
    const toppedUp = await send(transfer(first, { transferAmount: first.amount - received }));
    expect(toppedUp.body.data.status).toBe(Enums.WebhookLogStatus.PROCESSED);
    const before = (
      await api.get(apiPath('/memberships/me/current')).set(bearer(fixture.memberToken))
    ).body.data;
    const invoice = await buy();
    expect((await send(transfer(invoice))).body.data.status).toBe(Enums.WebhookLogStatus.PROCESSED);
    const after = (
      await api.get(apiPath('/memberships/me/current')).set(bearer(fixture.memberToken))
    ).body.data;
    expect(after.id).toBe(before.id);
    expect(new Date(after.endDate) - new Date(before.endDate)).toBe(plan.durationDays * 86400000);
    expect(after.paidInvoiceCount).toBe(
      await prisma.invoice.count({
        where: { membershipId: after.id, status: Enums.InvoiceStatus.PAID },
      }),
    );
    expect(after.paidInvoiceCount).toBeGreaterThan(before.paidInvoiceCount);
  });
});
