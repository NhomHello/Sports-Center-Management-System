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

describe('GY-32: hủy có tính phí, hoàn tiền qua admin bằng mã', () => {
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

  it('hủy khóa giữa chừng tạo mã hoàn, không cộng ví, admin xác nhận chuyển trả', async () => {
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
      { settlement: 'REFUND', reason: 'Liên hệ admin để nhận tiền hoàn' },
      f.memberToken,
    );
    expect(cancel.status).toBe(200);
    expect(cancel.body.data).toMatchObject({ kind: 'CANCEL_COURSE', settlement: 'REFUND' });
    expect(cancel.body.data.refundCode).toMatch(/^HT\d+$/u);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(0);
    const refund = await prisma.refund.findUniqueOrThrow({
      where: { id: cancel.body.data.refundId },
    });
    expect(refund.amount).toBe(preview.body.data.refundAmount);
    expect(refund.status).toBe('PENDING');
    expect((await prisma.classEnrollment.findUnique({ where: { id: enrollment.id } })).status).toBe(
      'CANCELLED',
    );

    const completed = await f.call('post', `/refunds/${refund.id}/complete`, {
      reference: 'BANK-COURSE-CANCEL',
    });
    expect(completed.status).toBe(200);
    expect(completed.body.data.status).toBe('DONE');
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(0);
  });
});
