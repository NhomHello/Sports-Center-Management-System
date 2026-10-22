import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  cancelQuote,
  coursePrice,
  remainingCourseValue,
} from '../src/modules/cancellation/settlement.js';
import {
  buyCourseCash,
  buyPlanCash,
  cleanupGopyFixture,
  createGopyFixture,
  createPaidClass,
  pastSessions,
} from './helpers/gopy.js';

let f;
beforeAll(async () => {
  f = await createGopyFixture();
});
afterAll(() => cleanupGopyFixture(f));

describe('GY-32/33: hủy có tính tiền, số dư tài khoản', () => {
  it('công thức hợp đồng: khóa 1.200.000 đ / 18 buổi, đã học 6 → còn 800.000, phí 80.000, hoàn 720.000', () => {
    const remainingValue = remainingCourseValue({ paid: 1200000, sessionCount: 18, unheld: 12 });
    expect(cancelQuote({ paid: 1200000, remainingValue, percent: 10, beforeStart: false })).toEqual(
      {
        paidAmount: 1200000,
        remainingValue: 800000,
        fee: 80000,
        refundAmount: 720000,
        beforeStart: false,
      },
    );
    expect(coursePrice(1500000, 12, 12) - remainingValue).toBe(700000);
  });

  it('hủy khóa giữa chừng ghi số dư; dùng số dư thanh toán hoá đơn mới', async () => {
    const item = await createPaidClass(f, { price: 1200000 });
    const enrollment = await buyCourseCash(f, item.id, f.member.id);
    const third = Math.round(item.totalSessions / 3);
    await pastSessions(item.id, third);
    const preview = await f.call(
      'get',
      `/enrollments/${enrollment.id}/cancel-preview`,
      undefined,
      f.memberToken,
    );
    expect(preview.status).toBe(200);
    const remaining = remainingCourseValue({
      paid: 1200000,
      sessionCount: item.totalSessions,
      unheld: item.totalSessions - third,
    });
    expect(preview.body.data).toMatchObject({
      paidAmount: 1200000,
      remainingValue: remaining,
      beforeStart: false,
    });
    const cancel = await f.call(
      'post',
      `/enrollments/${enrollment.id}/cancel`,
      { settlement: 'CREDIT' },
      f.memberToken,
    );
    expect(cancel.status).toBe(200);
    expect(cancel.body.data).toMatchObject({ kind: 'CANCEL_COURSE', settlement: 'CREDIT' });
    const credit = await f.call('get', '/me/credit', undefined, f.memberToken);
    expect(credit.body.data.balance).toBe(preview.body.data.refundAmount);
    expect((await prisma.classEnrollment.findUnique({ where: { id: enrollment.id } })).status).toBe(
      'CANCELLED',
    );

    const order = await f.call(
      'post',
      '/memberships/me/orders',
      { planId: f.planA.id },
      f.memberToken,
    );
    const applied = await f.call(
      'post',
      `/invoices/${order.body.data.id}/apply-credit`,
      {},
      f.memberToken,
    );
    expect(applied.status).toBe(200);
    expect(applied.body.data).toMatchObject({ status: 'PAID', creditApplied: 300000 });
    expect((await f.call('get', '/me/credit', undefined, f.memberToken)).body.data.balance).toBe(
      preview.body.data.refundAmount - 300000,
    );
    expect(await prisma.membership.count({ where: { invoiceId: order.body.data.id } })).toBe(1);
  });

  it('hủy kỳ gói chưa bắt đầu: hoàn 100%, không phí, tạo yêu cầu hoàn tiền', async () => {
    await buyPlanCash(f, f.other.id, f.planA.id);
    const queued = await buyPlanCash(f, f.other.id, f.planB.id);
    const preview = await f.call('get', `/memberships/${queued.id}/cancel-preview`);
    expect(preview.body.data).toMatchObject({
      remainingValue: 600000,
      fee: 0,
      refundAmount: 600000,
      beforeStart: true,
    });
    const res = await f.call('post', `/memberships/${queued.id}/cancel`, {
      settlement: 'REFUND',
      reason: 'Đổi ý',
    });
    expect(res.status).toBe(200);
    const refund = await prisma.refund.findUniqueOrThrow({ where: { id: res.body.data.refundId } });
    expect(refund).toMatchObject({
      amount: 600000,
      status: 'PENDING',
      invoiceId: queued.invoiceId,
    });
    expect((await prisma.membership.findUnique({ where: { id: queued.id } })).status).toBe(
      'CANCELLED',
    );
  });

  it('hội viên không hủy được kỳ gói của người khác', async () => {
    const period = await prisma.membership.findFirstOrThrow({
      where: { userId: f.other.id, status: 'ACTIVE' },
    });
    const res = await f.call(
      'get',
      `/memberships/${period.id}/cancel-preview`,
      undefined,
      f.memberToken,
    );
    expect(res.status).toBe(403);
  });
});
