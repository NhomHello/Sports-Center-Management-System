import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  buyCourseCash,
  buyPlanCash,
  cleanupGopyFixture,
  collectCash,
  createGopyFixture,
  createPaidClass,
} from './helpers/gopy.js';

let f;
beforeAll(async () => {
  f = await createGopyFixture();
});
afterAll(() => cleanupGopyFixture(f));

describe('GY-35: đổi gói / đổi lớp sau thanh toán, tính chênh lệch', () => {
  it('đổi lên gói đắt hơn: hóa đơn chênh lệch, thu đủ mới chuyển sang kỳ gói mới', async () => {
    const period = await buyPlanCash(f, f.other.id, f.planA.id);
    const preview = await f.call(
      'get',
      `/memberships/${period.id}/change-preview?planId=${f.planB.id}`,
    );
    expect(preview.status).toBe(200);
    const { remainingValue, difference } = preview.body.data;
    expect(preview.body.data.newPrice).toBe(600000);
    expect(difference).toBe(600000 - remainingValue);
    const change = await f.call('post', `/memberships/${period.id}/change`, { planId: f.planB.id });
    expect(change.status).toBe(200);
    expect(change.body.data).toMatchObject({ status: 'PENDING_PAYMENT', kind: 'CHANGE_PLAN' });
    const invoice = change.body.data.adjustmentInvoice;
    expect(invoice).toMatchObject({ kind: 'ADJUSTMENT', amount: difference, channel: 'COUNTER' });
    expect((await prisma.membership.findUnique({ where: { id: period.id } })).status).toBe(
      'ACTIVE',
    );
    const again = await f.call('post', `/memberships/${period.id}/change`, { planId: f.planB.id });
    expect(again.status).toBe(409);
    await collectCash(f, invoice.id);
    expect((await prisma.membership.findUnique({ where: { id: period.id } })).status).toBe(
      'CANCELLED',
    );
    const next = await prisma.membership.findUniqueOrThrow({ where: { invoiceId: invoice.id } });
    expect(next).toMatchObject({ planId: f.planB.id, status: 'ACTIVE', activeUserId: f.other.id });
    const done = await prisma.purchaseChange.findUniqueOrThrow({
      where: { id: change.body.data.id },
    });
    expect(done.status).toBe('DONE');
  });

  it('đổi xuống gói rẻ hơn: xong ngay, phần dư ghi số dư', async () => {
    const current = await prisma.membership.findFirstOrThrow({
      where: { userId: f.other.id, planId: f.planB.id, status: 'ACTIVE' },
    });
    const noChoice = await f.call('post', `/memberships/${current.id}/change`, {
      planId: f.planA.id,
    });
    expect(noChoice.status).toBe(422);
    const res = await f.call('post', `/memberships/${current.id}/change`, {
      planId: f.planA.id,
      settlement: 'CREDIT',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DONE');
    expect(res.body.data.difference).toBeLessThan(0);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: f.other.id } });
    expect(user.creditBalance).toBe(-res.body.data.difference);
  });

  it('đổi lớp sang khóa rẻ hơn: lớp mới chính thức, lớp cũ hủy, phần dư hoàn tiền', async () => {
    const from = await createPaidClass(f, { price: 1500000 });
    const to = await createPaidClass(f, {
      price: 900000,
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
    });
    const enrollment = await buyCourseCash(f, from.id, f.member.id);
    const preview = await f.call(
      'get',
      `/enrollments/${enrollment.id}/change-preview?classId=${to.id}`,
      undefined,
      f.memberToken,
    );
    expect(preview.body.data).toMatchObject({
      remainingValue: 1500000,
      newPrice: 900000,
      difference: -600000,
    });
    const res = await f.call(
      'post',
      `/enrollments/${enrollment.id}/change`,
      { classId: to.id, settlement: 'REFUND' },
      f.memberToken,
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'DONE', kind: 'CHANGE_CLASS' });
    expect(
      (await prisma.refund.findUniqueOrThrow({ where: { id: res.body.data.refundId } })).amount,
    ).toBe(600000);
    const moved = await prisma.classEnrollment.findUniqueOrThrow({
      where: { classId_memberId: { classId: to.id, memberId: f.member.id } },
    });
    expect(moved.status).toBe('BOOKED');
    expect((await prisma.classEnrollment.findUnique({ where: { id: enrollment.id } })).status).toBe(
      'CANCELLED',
    );
  });
});
