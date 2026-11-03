import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
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

describe('GY-35: đổi gói / đổi lớp sau thanh toán, tính chênh lệch', () => {




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
