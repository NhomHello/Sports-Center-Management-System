import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  importHistoricalConflict,
  invoiceStatus,
  sendConflictTransfer,
} from './helpers/course-conflict.js';
import { createGopyFixture, cleanupGopyFixture, createPaidClass } from './helpers/gopy.js';
let f;
let first;
let second;
let pending;
let sepayId;
const sepayIds = [];
const order = (course, memberId, channel = 'COUNTER') =>
  f.call('post', `/classes/${course.id}/orders`, { memberId, channel });
beforeAll(async () => {
  f = await createGopyFixture();
  first = await createPaidClass(f, { price: 600000, capacity: 10 });
  second = await createPaidClass(f, {
    price: 600000,
    capacity: 10,
    roomId: f.roomOther.id,
    coachId: f.coachOther.id,
  });
});
afterAll(async () => {
  if (sepayId) {
    await prisma.reconciliationCase.deleteMany({
      where: { webhookLog: { providerTransactionId: { in: sepayIds } } },
    });
    await prisma.paymentWebhookLog.deleteMany({
      where: { providerTransactionId: { in: sepayIds } },
    });
  }
  await cleanupGopyFixture(f);
});
describe('TC-PAY-CONFLICT: cả tại quầy và online phải kiểm tra trùng lịch', () => {
  it('01: hai khóa trùng giờ mua cùng lúc chỉ một giữ chỗ, không có hóa đơn thừa', async () => {
    const results = await Promise.all([order(first, f.member.id), order(second, f.member.id)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect(await prisma.invoice.count({ where: { userId: f.member.id } })).toBe(1);
  });
  it('02: lịch đổi sau giữ chỗ thì ẩn QR và không thu tiền mặt hoặc số dư', async () => {
    // Đưa khóa thứ hai sang giờ khác trước khi học viên mua.
    for (const session of second.sessions)
      await prisma.classSession.update({
        where: { id: session.id },
        data: {
          startAt: new Date(new Date(session.startAt).getTime() + 2 * 3600000),
          endAt: new Date(new Date(session.endAt).getTime() + 2 * 3600000),
        },
      });
    const booked = await order(second, f.other.id);
    expect(booked.status).toBe(201);
    expect(
      (await f.call('post', `/payments/invoices/${booked.body.data.id}/cash`, {})).status,
    ).toBe(200);
    const held = await order(first, f.other.id, 'ONLINE');
    expect(held.status).toBe(201);
    pending = held.body.data;
    const changed = await f.call('patch', `/classes/sessions/${second.sessions[0].id}`, {
      startAt: first.sessions[0].startAt,
      endAt: first.sessions[0].endAt,
    });
    expect(changed.status).toBe(409);
    // Import a historical conflict: payment safety must also protect data from older deployments.
    await importHistoricalConflict(second.sessions[0].id, first.sessions[0]);
    const detail = await f.call('get', `/invoices/${pending.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.paymentBlockReason).toContain('trùng lịch');
    expect(detail.body.data.paymentInstruction).toBeNull();
    await prisma.invoice.update({ where: { id: pending.id }, data: { channel: 'COUNTER' } });
    expect((await f.call('post', `/payments/invoices/${pending.id}/cash`, {})).status).toBe(409);
    await prisma.invoice.update({ where: { id: pending.id }, data: { channel: 'ONLINE' } });
    await prisma.user.update({
      where: { id: f.other.id },
      data: { creditBalance: pending.amount },
    });
    const credit = await f.call('post', `/invoices/${pending.id}/apply-credit`, {}, f.otherToken);
    expect(credit.status).toBe(409);
    expect((await prisma.user.findUnique({ where: { id: f.other.id } })).creditBalance).toBe(
      pending.amount,
    );
    expect(await prisma.payment.count({ where: { invoiceId: pending.id } })).toBe(0);
  });
  it('03: SePay đã nhận tiền thì lưu đối soát, không tự BOOKED khi lịch bị trùng', async () => {
    sepayId = `conflict-${Date.now()}`;
    sepayIds.push(sepayId);
    const response = await sendConflictTransfer(sepayId, pending);
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('NEEDS_REVIEW');
    expect(response.body.data.reason).toBe('SCHEDULE_CONFLICT');
    expect(await prisma.payment.count({ where: { invoiceId: pending.id } })).toBe(0);
    const review = await prisma.reconciliationCase.findFirstOrThrow({
      where: { invoiceId: pending.id },
    });
    expect(review.amount).toBe(pending.amount);
    expect(review.note).toContain('trùng');
    expect(
      (await prisma.classEnrollment.findFirst({ where: { invoiceId: pending.id } })).status,
    ).toBe('PENDING_PAYMENT');
  });
  it('04: hoàn đủ giao dịch trùng lịch thì đóng phiếu, hủy invoice rỗng và nhả chỗ', async () => {
    const review = await prisma.reconciliationCase.findFirstOrThrow({
      where: { invoiceId: pending.id, reason: 'SCHEDULE_CONFLICT' },
    });
    const path = `/reconciliations/${review.id}`;
    expect((await f.call('post', `${path}/refund`, { reason: 'Hoàn do trùng lịch' })).status).toBe(
      422,
    );
    await f.call('post', `${path}/contacts`, {
      channel: 'PHONE',
      content: 'Học viên chọn hoàn tiền do trùng lịch',
      result: 'Đã đồng ý',
    });
    const partial = await f.call('post', `${path}/refund`, {
      amount: pending.amount - 1000,
      reason: 'Hoàn một phần',
    });
    expect(partial.status).toBe(422);
    expect(await prisma.refund.count({ where: { caseId: review.id } })).toBe(0);
    const refunded = await f.call('post', `${path}/refund`, {
      reason: 'Hoàn toàn bộ giao dịch trùng lịch',
    });
    expect(refunded.status).toBe(201);
    expect(refunded.body.data.amount).toBe(pending.amount);
    expect(await invoiceStatus(pending.id)).toBe('FAILED');
    const released = await prisma.classEnrollment.findFirstOrThrow({
      where: { invoiceId: pending.id },
    });
    expect(released.status).toBe('CANCELLED');
    expect(released.cancelledBy).toBe(f.admin.id);
    expect(
      (
        await f.call('post', `/refunds/${refunded.body.data.id}/complete`, {
          reference: 'BANK-CF-REFUND',
        })
      ).status,
    ).toBe(200);
    expect(
      (await prisma.reconciliationCase.findUniqueOrThrow({ where: { id: review.id } })).status,
    ).toBe('REFUNDED');
  });
  it('05: đổi sang khóa hợp lệ thì gán tiền và tạo giữ chỗ trong cùng transaction', async () => {
    // Reproduce an imported historical conflict after creating a new valid hold.
    const start = new Date(new Date(first.sessions[0].startAt).getTime() + 2 * 3600000);
    await f.call('patch', `/classes/sessions/${second.sessions[0].id}`, {
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + 3600000).toISOString(),
    });
    const held = await order(first, f.other.id, 'ONLINE');
    expect(held.status).toBe(201);
    const old = held.body.data;
    await importHistoricalConflict(second.sessions[0].id, first.sessions[0]);
    sepayId = `conflict-switch-${Date.now()}`;
    sepayIds.push(sepayId);
    await sendConflictTransfer(sepayId, old);
    const review = await prisma.reconciliationCase.findFirstOrThrow({
      where: { invoiceId: old.id, reason: 'SCHEDULE_CONFLICT' },
    });
    await f.call('post', `/reconciliations/${review.id}/contacts`, {
      channel: 'PHONE',
      content: 'Học viên chọn khóa giờ khác',
      result: 'Đồng ý chuyển tiền sang khóa phù hợp',
    });
    const target = await createPaidClass(f, {
      price: old.amount,
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
      weeklySchedule: [
        { dayOfWeek: new Date(first.startsOn).getUTCDay(), startTime: '21:00', endTime: '22:00' },
      ],
    });
    const mapped = await f.call('post', `/reconciliations/${review.id}/map`, {
      memberId: f.other.id,
      classId: target.id,
    });
    expect(mapped.status).toBe(200);
    expect(mapped.body.data.status).toBe('MATCHED');
    expect(await invoiceStatus(old.id)).toBe('FAILED');
    expect(
      (await prisma.classEnrollment.findFirstOrThrow({ where: { invoiceId: old.id } })).status,
    ).toBe('CANCELLED');
    const assigned = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: target.id, memberId: f.other.id } },
    });
    expect(assigned.status).toBe('BOOKED');
    expect(
      (await prisma.invoice.findUniqueOrThrow({ where: { id: assigned.invoiceId } })).status,
    ).toBe('PAID');
    const before = await prisma.invoice.count({ where: { userId: f.other.id } });
    expect(
      (
        await f.call('post', `/reconciliations/${review.id}/map`, {
          memberId: f.other.id,
          classId: target.id,
        })
      ).status,
    ).toBe(409);
    expect(await prisma.invoice.count({ where: { userId: f.other.id } })).toBe(before);
  });
});
