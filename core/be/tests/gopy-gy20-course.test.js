import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { expireOverdueInvoices } from '../src/modules/payment/invoice-expiry.job.js';
import {
  frameContains,
  vietnamClock,
} from '../src/modules/operating-frame/operating-frame.service.js';
import {
  buyCourseCash,
  buyPlanCash,
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

  it('check-in từ chối ngoài khung giờ hoặc khu vực của gói', async () => {
    const clock = vietnamClock(new Date());
    const frames = await prisma.operatingFrame.findMany({ where: { isActive: true } });
    const outside = frames.find((frame) => !frameContains(frame, clock));
    const area = await prisma.roomType.create({
      data: { name: `${f.prefix} Khu tự tập`, isSelfTrainingArea: true },
    });
    const plan = await f.call('post', '/membership-plans', {
      code: `${f.prefix.toUpperCase()}_EARLY`,
      name: `${f.prefix} Early`,
      price: 290000,
      durationDays: 30,
      frameIds: [outside.id],
      roomTypeIds: [area.id],
    });
    expect(plan.status).toBe(201);
    expect(plan.body.data.frames).toEqual([expect.objectContaining({ id: outside.id })]);
    await buyPlanCash(f, f.other.id, plan.body.data.id);
    const denied = await f.call('post', '/check-ins', { memberId: f.other.id });
    expect(denied.status).toBe(422);
    expect(denied.body.message).toContain('Ngoài khung giờ của gói');
    await prisma.planFrame.deleteMany({ where: { planId: plan.body.data.id } });
    const wrongArea = await f.call('post', '/check-ins', {
      memberId: f.other.id,
      roomTypeId: f.roomType.id,
    });
    expect(wrongArea.body.message).toContain('Gói không cho vào khu vực');
    const ok = await f.call('post', '/check-ins', { memberId: f.other.id, roomTypeId: area.id });
    expect(ok.status).toBe(201);
    await prisma.planRoomType.deleteMany({ where: { planId: plan.body.data.id } });
    await prisma.roomType.delete({ where: { id: area.id } });
  });

  it('kỳ đang dùng + kỳ mua nối tiếp hiện trong /memberships/me/current', async () => {
    await buyPlanCash(f, f.member.id, f.planA.id);
    const res = await f.call('get', '/memberships/me/current', undefined, f.memberToken);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACTIVE');
    const next = res.body.data.nextPeriods.at(-1);
    expect(next.planId).toBe(f.planA.id);
    expect(new Date(next.startDate).getTime()).toBeGreaterThan(Date.now());
  });
});
