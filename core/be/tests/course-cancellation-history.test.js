import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/db.js';
import { cleanupGopyFixture } from './helpers/gopy.js';
import { createCancellationHistoryFixture } from './helpers/cancellation-history.js';
let f;
let item;
let enrollment;
let change;
beforeAll(async () => {
  ({ f, item, enrollment } = await createCancellationHistoryFixture());
});
afterAll(async () => cleanupGopyFixture(f));
const ownHistory = (id) => f.call('get', `/course-cancellations/${id}`, undefined, f.memberToken);

describe('TC-CANCEL-HISTORY: hủy không xóa lịch sử, hoàn tiền qua admin bằng mã', () => {
  it('TC-CANCEL-HISTORY-01: không nhận CREDIT, hủy REFUND giữ snapshot 20/10/10 và không cộng ví', async () => {
    const rejected = await f.call(
      'post',
      `/enrollments/${enrollment.id}/cancel`,
      { settlement: 'CREDIT', reason: 'Thử ví' },
      f.memberToken,
    );
    expect(rejected.status).toBe(400);
    const result = await f.call(
      'post',
      `/enrollments/${enrollment.id}/cancel`,
      { settlement: 'REFUND', reason: 'Đổi lịch làm việc' },
      f.memberToken,
    );
    expect(result.status).toBe(200);
    change = result.body.data;
    expect(change.refundCode).toMatch(/^HT\d+$/u);
    const history = await f.call('get', '/course-cancellations/me', undefined, f.memberToken);
    expect(history.status).toBe(200);
    const row = history.body.data.find((r) => r.id === change.id);
    expect(row).toMatchObject({
      reason: 'Đổi lịch làm việc',
      purchasedSessions: 20,
      usedSessions: 10,
      remainingSessions: 10,
      paidAmount: 1000000,
      remainingValue: 500000,
      payoutStatus: 'PENDING',
      refund: { code: change.refundCode },
    });
    expect(row.refundAmount).toBe(500000 - row.fee);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: f.member.id } })).creditBalance,
    ).toBe(0);
  });
  it('TC-CANCEL-HISTORY-02: chỉ chủ tài khoản hoặc nhân viên có quyền được xem; không cho chèn memberId vào /me', async () => {
    expect(
      (await f.call('get', `/course-cancellations/${change.id}`, undefined, f.otherToken)).status,
    ).toBe(404);
    expect((await f.call('get', '/course-cancellations', undefined, f.memberToken)).status).toBe(
      403,
    );
    expect(
      (
        await f.call(
          'get',
          `/course-cancellations/me?memberId=${f.other.id}`,
          undefined,
          f.memberToken,
        )
      ).status,
    ).toBe(400);
    const ownRefunds = await f.call(
      'get',
      `/refunds/me?search=${change.refundCode}`,
      undefined,
      f.memberToken,
    );
    expect(ownRefunds.status).toBe(200);
    expect(ownRefunds.body.data).toHaveLength(1);
    expect(ownRefunds.body.data[0].code).toBe(change.refundCode);
    const other = await f.call(
      'get',
      `/refunds/me?search=${change.refundCode}`,
      undefined,
      f.otherToken,
    );
    expect(other.body.data).toEqual([]);
    expect(
      (
        await f.call(
          'post',
          `/refunds/${change.refundId}/complete`,
          { reference: 'Không được tự xác nhận' },
          f.memberToken,
        )
      ).status,
    ).toBe(403);
  });
  it('TC-CANCEL-HISTORY-03: hội viên/admin/HLV được thông báo đúng phạm vi, HLV không nhận số tiền/mã hoàn', async () => {
    const owner = await prisma.notification.findMany({ where: { userId: f.member.id } });
    expect(owner.some((n) => n.title.includes(change.refundCode))).toBe(true);
    const staff = await prisma.notification.findMany({
      where: { userId: f.admin.id, dedupeKey: { startsWith: `refund:${change.refundId}:` } },
    });
    expect(staff.some((n) => n.title.includes(change.refundCode))).toBe(true);
    const coach = await prisma.notification.findMany({
      where: { userId: f.coach.id, dedupeKey: { startsWith: `course-cancel:${change.id}:` } },
    });
    expect(coach).toHaveLength(1);
    expect(coach[0].message).not.toContain(change.refundCode);
    expect(coach[0].message).not.toContain('500.000');
    const offered = await prisma.notification.findMany({ where: { userId: f.other.id } });
    expect(offered.map((n) => n.kind)).toEqual(['WAITLIST_OFFER']);
    expect(offered[0].message).not.toContain(change.refundCode);
    expect(
      await prisma.notification.count({
        where: {
          userId: f.coachOther.id,
          dedupeKey: { startsWith: `course-cancel:${change.id}:` },
        },
      }),
    ).toBe(1);
    const again = await f.call(
      'post',
      `/enrollments/${enrollment.id}/cancel`,
      { settlement: 'REFUND', reason: 'Lặp' },
      f.memberToken,
    );
    expect(again.status).toBe(422);
    expect(await prisma.refund.count({ where: { invoiceId: enrollment.invoiceId } })).toBe(1);
  });
  it('TC-CANCEL-HISTORY-04: admin tra mã và xác nhận xong thì hội viên thấy đã hoàn; dữ liệu học vẫn còn', async () => {
    const found = await f.call('get', `/refunds?search=${change.refundCode}`);
    expect(found.body.data.map((r) => r.id)).toEqual([change.refundId]);
    const done = await f.call('post', `/refunds/${change.refundId}/complete`, {
      reference: 'BANK-HT-HISTORY',
    });
    expect(done.status).toBe(200);
    expect(
      (
        await f.call('post', `/invoices/${enrollment.invoiceId}/refund`, {
          reason: 'Không hoàn lặp khóa đã hủy',
        })
      ).status,
    ).toBe(409);
    const oldInvoice = await f.call(
      'get',
      `/invoices/${enrollment.invoiceId}`,
      undefined,
      f.memberToken,
    );
    expect(oldInvoice.body.data.courseCancellation.id).toBe(change.id);
    const detail = await ownHistory(change.id);
    expect(detail.body.data.refund).toMatchObject({
      status: 'DONE',
      reference: 'BANK-HT-HISTORY',
      code: change.refundCode,
    });
    expect(await prisma.attendance.count({ where: { memberId: f.member.id } })).toBe(1);
    expect(await prisma.sessionFeedback.count({ where: { memberId: f.member.id } })).toBe(1);
    expect(await prisma.payment.count({ where: { invoiceId: enrollment.invoiceId } })).toBe(1);
    expect(
      (await f.call('get', `/attendance/me?classId=${item.id}`, undefined, f.memberToken)).body
        .data,
    ).toHaveLength(1);
    expect(
      (await f.call('get', `/attendance/feedback/me?classId=${item.id}`, undefined, f.memberToken))
        .body.data,
    ).toHaveLength(1);
    expect(
      await prisma.notification.count({
        where: {
          userId: f.member.id,
          dedupeKey: `refund:${change.refundId}:completed:${f.member.id}`,
        },
      }),
    ).toBe(1);
  });
  it('TC-CANCEL-HISTORY-05: đổi tên/lịch và đăng ký lại không làm đổi lịch sử hủy cũ', async () => {
    await prisma.gymClass.update({
      where: { id: item.id },
      data: { name: 'Tên khóa hiện tại đã đổi', registrationEndAt: item.sessions.at(-1).startAt },
    });
    await f.call('delete', `/classes/${item.id}/waitlist/me`, {}, f.otherToken);
    const rebuy = await f.call('post', `/classes/${item.id}/orders`, {}, f.memberToken);
    expect(rebuy.status).toBe(201);
    const history = await ownHistory(change.id);
    expect(history.body.data.courseName).toContain(item.name);
    expect(history.body.data).toMatchObject({
      purchasedSessions: 20,
      remainingSessions: 10,
      remainingValue: 500000,
    });
    expect(history.body.data.invoice.id).toBe(enrollment.invoiceId);
    expect(rebuy.body.data.id).not.toBe(enrollment.invoiceId);
  });
});
