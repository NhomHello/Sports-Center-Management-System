import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { signAccessToken } from '../src/common/utils/jwt.js';
import { api, apiPath, bearer } from './helpers/api.js';
import { classPayload, createClassFixture, cleanupClassFixture } from './helpers/sprint2.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
let f; let item; let users;
const order = (token, body = {}) => api.post(apiPath(`/classes/${item.id}/orders`)).set(bearer(token)).send({ joinWaitlistWhenFull: true, ...body });
beforeAll(async () => {
  f = await createClassFixture();
  const created = await api.post(apiPath('/classes')).set(bearer(f.adminToken)).send(classPayload(f, { price: 900000, capacity: 3 }));
  expect(created.status).toBe(201); item = created.body.data;
  users = await Promise.all(Array.from({ length: 16 }, (_, i) => prisma.user.create({ data: {
    email: `${f.prefix}_race${i}@scms.test`, fullName: `Học viên đồng thời ${i}`, passwordHash: f.member.passwordHash, roleId: f.member.roleId, emailVerifiedAt: new Date() } })));
  f.userIds.push(...users.map((u) => u.id));
});
afterAll(async () => {
  if (!f) return;
  const invoices = await prisma.invoice.findMany({ where: { classId: item.id }, select: { id: true } });
  await prisma.reconciliationCase.deleteMany({ where: { invoiceId: { in: invoices.map((i) => i.id) } } });
  await prisma.paymentWebhookLog.deleteMany({ where: { invoiceId: { in: invoices.map((i) => i.id) } } });
  await prisma.classWaitlist.deleteMany({ where: { classId: item.id } });
  await prisma.classEnrollment.updateMany({ where: { classId: item.id }, data: { invoiceId: null } });
  await prisma.payment.deleteMany({ where: { invoiceId: { in: invoices.map((i) => i.id) } } });
  await prisma.invoice.deleteMany({ where: { classId: item.id } });
  await cleanupClassFixture(f);
});
const transfer = (invoice, id) => api.post(apiPath('/payments/sepay/webhook')).set({ Authorization: `Apikey ${env.SEPAY_WEBHOOK_API_KEY}` }).send({ id, gateway: 'ACB', transferType: 'in', transferAmount: invoice.amount, code: invoice.code, content: invoice.code });

describe('TC-COURSE-RACE: thanh toán và hàng đợi đồng thời', () => {
  it('01: bấm mua 6 lần đồng thời chỉ có 1 invoice và 1 giữ chỗ', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => order(f.memberToken)));
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(new Set(results.map((r) => r.body.data.id)).size).toBe(1);
    expect(await prisma.invoice.count({ where: { classId: item.id } })).toBe(1);
  });
  it('02: 16 người tranh 2 chỗ còn lại, người thua vào hàng chờ và không có invoice mồ côi', async () => {
    const results = await Promise.all(users.map((u) => order(signAccessToken({ sub: u.id }))));
    expect(results.every((r) => r.status === 201)).toBe(true);
    expect(results.filter((r) => !r.body.data.queued)).toHaveLength(2);
    expect(results.filter((r) => r.body.data.queued)).toHaveLength(14);
    expect(await prisma.classEnrollment.count({ where: { classId: item.id, status: 'PENDING_PAYMENT' } })).toBe(3);
    expect(await prisma.invoice.count({ where: { classId: item.id } })).toBe(3);
  });
  it('03: webhook lặp đồng thời không ghi hai payment, không vượt sức chứa', async () => {
    const invoice = await prisma.invoice.findFirst({ where: { classId: item.id, userId: f.member.id } });
    const ref = `race-${invoice.id}-${Date.now()}`;
    const results = await Promise.all([transfer(invoice, ref), transfer(invoice, ref)]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(await prisma.payment.count({ where: { invoiceId: invoice.id } })).toBe(1);
    expect(await prisma.classEnrollment.count({ where: { classId: item.id, status: 'BOOKED' } })).toBe(1);
  });
  it('04: hết hạn nhả chỗ cho người đứng đầu; tiền tới muộn không giành lại chỗ', async () => {
    const invoice = await prisma.invoice.findFirst({ where: { classId: item.id, status: 'PENDING' } });
    const first = await prisma.classWaitlist.findFirst({ where: { classId: item.id, status: 'WAITING' }, orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }] });
    await prisma.invoice.update({ where: { id: invoice.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expireOverdueInvoices();
    expect((await prisma.classWaitlist.findUnique({ where: { id: first.id } })).status).toBe('OFFERED');
    const accepted = await order(signAccessToken({ sub: first.memberId })); expect(accepted.status).toBe(201); expect(accepted.body.data.queued).not.toBe(true);
    const late = await transfer(invoice, `late-${invoice.id}-${Date.now()}`); expect(late.status).toBe(200);
    expect(late.body.data.reason).toBe('LATE');
    const held = await prisma.classEnrollment.count({ where: { classId: item.id, status: { in: ['BOOKED', 'PENDING_PAYMENT'] } } }); expect(held).toBe(3);
  });
});
