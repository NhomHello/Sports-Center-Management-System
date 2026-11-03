import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';

import {
  buyCourseCash,
  cleanupGopyFixture,
  createGopyFixture,
  createPaidClass,
} from './helpers/gopy.js';

let f;
beforeAll(async () => {
  f = await createGopyFixture();
});
afterAll(() => cleanupGopyFixture(f));

describe('GY-20: khóa học có học phí, kỳ gói theo hóa đơn, check-in theo khung giờ', () => {
  it('mua khóa online giữ chỗ PENDING_PAYMENT; hết hạn thanh toán thì nhả chỗ', async () => {
    const item = await createPaidClass(f, { capacity: 1 });
    expect(item).toMatchObject({ price: 1200000, priceForRemaining: 1200000 });
    const order = await f.call('post', `/classes/${item.id}/orders`, {}, f.memberToken);
    expect(order.status).toBe(201);
    expect(order.body.data).toMatchObject({
      kind: 'COURSE',
      classId: item.id,
      amount: 1200000,
      sessionCount: item.totalSessions,
      channel: 'ONLINE',
    });
    const again = await f.call('post', `/classes/${item.id}/orders`, {}, f.memberToken);
    expect(again.body.data.id).toBe(order.body.data.id);
    const forOther = await f.call('get', `/classes/${item.id}?memberId=${f.other.id}`);
    expect(forOther.body.data).toMatchObject({ seatsRemaining: 0, canEnroll: false });
    await prisma.invoice.update({
      where: { id: order.body.data.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await expireOverdueInvoices();
    const hold = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: item.id, memberId: f.member.id } },
    });
    expect(hold.status).toBe('CANCELLED');
  });

  it('thu đủ học phí tại quầy thì đăng ký thành chính thức', async () => {
    const item = await createPaidClass(f, { roomId: f.roomOther.id, coachId: f.coachOther.id });
    const enrollment = await buyCourseCash(f, item.id, f.other.id);
    expect(enrollment).toMatchObject({ status: 'BOOKED' });
    const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: enrollment.invoiceId } });
    expect(invoice).toMatchObject({ kind: 'COURSE', status: 'PAID', amount: 1200000 });
  });




});
