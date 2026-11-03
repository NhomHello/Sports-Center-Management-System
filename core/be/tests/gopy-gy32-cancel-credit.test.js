import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  cancelQuote,
  coursePrice,
  remainingCourseValue,
} from '../src/modules/cancellation/settlement.js';
import {
  buyCourseCash,
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

    const nextCourse = await createPaidClass(f, { price: 300000, roomId: f.roomOther.id, coachId: f.coachOther.id });
    const order = await f.call('post', `/classes/${nextCourse.id}/orders`, {}, f.memberToken);
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
    expect(await prisma.classEnrollment.count({ where: { invoiceId: order.body.data.id, status: 'BOOKED' } })).toBe(1);
  });




});
