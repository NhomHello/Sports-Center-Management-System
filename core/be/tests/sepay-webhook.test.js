import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { api, apiPath, bearer } from './helpers/api.js';
import {
  createReconciliationFixture,
  cleanupReconciliationFixture,
  createReconciliationCourse,
  sendTransfer,
} from './helpers/reconciliation.js';
let f;
const buy = async (channel = 'ONLINE') => {
  const course = await createReconciliationCourse(f);
  const res = await api
    .post(apiPath(`/classes/${course.id}/orders`))
    .set(bearer(channel === 'ONLINE' ? f.memberToken : f.adminToken))
    .send(channel === 'ONLINE' ? {} : { memberId: f.member.id, channel });
  expect(res.status).toBe(201);
  return res.body.data;
};
beforeAll(async () => {
  f = await createReconciliationFixture();
});
afterAll(async () => cleanupReconciliationFixture(f));
describe('TC-COURSE-SEPAY: giữ giao thức SePay cho bán khóa học', () => {
  it('TC-COURSE-SEPAY-01: đúng tiền xác nhận COURSE, không tạo membership và không tính giá từ client', async () => {
    const invoice = await buy();
    expect(invoice.kind).toBe('COURSE');
    expect((await sendTransfer(f, invoice)).outcome).toBe('PAID');
    expect(
      await prisma.classEnrollment.count({ where: { invoiceId: invoice.id, status: 'BOOKED' } }),
    ).toBe(1);
    expect(await prisma.membership.count({ where: { userId: f.member.id } })).toBe(0);
  });
  it('TC-COURSE-SEPAY-02: SePay gửi lặp id chỉ ghi một khoản thu', async () => {
    const invoice = await buy();
    await sendTransfer(f, invoice);
    const previous = f.sepayIds.at(-1);
    const repeated = await sendTransfer(f, invoice, { id: previous });
    expect(repeated.status).toBe('DUPLICATE');
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
  });
  it('TC-COURSE-SEPAY-03: code rỗng vẫn khớp từ nội dung chuyển khoản', async () => {
    const invoice = await buy();
    const res = await sendTransfer(f, invoice, {
      code: null,
      content: `Thanh toan ${invoice.code}`,
    });
    expect(res.outcome).toBe('PAID');
  });
  it('TC-COURSE-SEPAY-04: thiếu/thừa mở đối soát, không đăng ký chính thức trước khi đủ tiền', async () => {
    const invoice = await buy();
    expect((await sendTransfer(f, invoice, { transferAmount: 100000 })).outcome).toBe('UNDERPAID');
    expect(
      await prisma.classEnrollment.count({ where: { invoiceId: invoice.id, status: 'BOOKED' } }),
    ).toBe(0);
    expect((await sendTransfer(f, invoice, { transferAmount: 200000 })).outcome).toBe('PAID');
    const over = await buy();
    expect((await sendTransfer(f, over, { transferAmount: 350000 })).outcome).toBe('OVERPAID');
    expect((await prisma.invoice.findUnique({ where: { id: over.id } })).status).toBe('PENDING');
  });
  it('TC-COURSE-SEPAY-05: không dùng webhook cho hóa đơn tại quầy; khóa API sai bị chặn', async () => {
    const invoice = await buy('COUNTER');
    expect((await sendTransfer(f, invoice)).reason).toBe('NO_MATCH');
    const res = await api
      .post(apiPath('/payments/sepay/webhook'))
      .set({ Authorization: 'Apikey invalid-test-secret' })
      .send({ id: 'invalid', transferType: 'in', transferAmount: 1 });
    expect(res.status).toBe(401);
  });
  it('matches the bank memo when SePay extracts a different configured prefix', async () => {
    const invoice = await buy();
    const result = await sendTransfer(f, invoice, {
      code: 'SEV12345',
      content: `ACB IBFT ${invoice.code} thanh toan`,
    });
    expect(result).toMatchObject({ status: 'PROCESSED', outcome: 'PAID' });
    expect((await prisma.invoice.findUnique({ where: { id: invoice.id } })).status).toBe('PAID');
    expect(
      await prisma.classEnrollment.count({ where: { invoiceId: invoice.id, status: 'BOOKED' } }),
    ).toBe(1);
  });
  it('concurrent outgoing retries are acknowledged once without a server error', async () => {
    const id = `${Date.now()}9911`;
    f.sepayIds.push(id);
    const results = await Promise.all([
      sendTransfer(f, null, { id, transferType: 'out' }),
      sendTransfer(f, null, { id, transferType: 'out' }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual(['DUPLICATE', 'IGNORED']);
    expect(await prisma.paymentWebhookLog.count({ where: { providerTransactionId: id } })).toBe(1);
  });
});
