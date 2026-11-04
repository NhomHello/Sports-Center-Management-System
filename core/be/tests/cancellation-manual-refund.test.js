import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import {
  createGopyFixture,
  cleanupGopyFixture,
  createPaidClass,
  buyCourseCash,
} from './helpers/gopy.js';
let f;
beforeAll(async () => {
  f = await createGopyFixture();
});
afterAll(async () => cleanupGopyFixture(f));

describe('TC-CANCEL-MANUAL: mọi khoản hủy được hoàn qua admin, không cộng ví', () => {
  it('TC-CANCEL-MANUAL-01: trung tâm hủy một buổi rồi hội viên hủy phần còn lại, không tính lại sai đơn giá/phí', async () => {
    const item = await createPaidClass(f, { price: 1200000 });
    const enrollment = await buyCourseCash(f, item.id, f.member.id);
    const perSession = 1200000 / item.totalSessions;
    expect(
      (
        await f.call('post', `/classes/sessions/${item.sessions[0].id}/cancellation`, {
          reason: 'Trung tâm hủy một buổi',
        })
      ).status,
    ).toBe(200);
    const one = await prisma.refund.findFirstOrThrow({
      where: { invoiceId: enrollment.invoiceId },
    });
    expect(one).toMatchObject({ amount: perSession, status: 'PENDING' });
    const preview = await f.call(
      'get',
      `/enrollments/${enrollment.id}/cancel-preview`,
      undefined,
      f.memberToken,
    );
    expect(preview.body.data).toMatchObject({
      remainingValue: 1200000 - perSession,
      beforeStart: true,
      fee: 0,
    });
    const cancel = await f.call(
      'post',
      `/enrollments/${enrollment.id}/cancel`,
      { settlement: 'REFUND', reason: 'Hủy phần còn lại' },
      f.memberToken,
    );
    expect(cancel.status).toBe(200);
    const refunds = await prisma.refund.aggregate({
      where: { invoiceId: enrollment.invoiceId },
      _sum: { amount: true },
    });
    expect(refunds._sum.amount).toBe(1200000);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(0);
  });
  it('TC-CANCEL-MANUAL-02: trung tâm hủy cả lớp tạo lịch sử và mã hoàn, gọi lặp không tạo hoàn lần hai', async () => {
    const item = await createPaidClass(f, {
      price: 1000000,
      roomId: f.roomOther.id,
      coachId: f.coachOther.id,
    });
    const enrollment = await buyCourseCash(f, item.id, f.other.id);
    expect((await f.call('delete', `/classes/${item.id}`)).status).toBe(200);
    expect((await f.call('delete', `/classes/${item.id}`)).status).toBe(200);
    expect(await prisma.refund.count({ where: { invoiceId: enrollment.invoiceId } })).toBe(1);
    const history = await f.call('get', '/course-cancellations/me', undefined, f.otherToken);
    const row = history.body.data.find((r) => r.invoice.id === enrollment.invoiceId);
    expect(row).toMatchObject({ refundAmount: 1000000, fee: 0, payoutStatus: 'PENDING' });
    expect(row.refund.code).toMatch(/^HT\d+$/u);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: f.other.id } })).creditBalance).toBe(
      0,
    );
  });
});
