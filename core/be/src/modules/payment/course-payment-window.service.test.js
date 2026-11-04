import { describe, expect, it, vi } from 'vitest';
vi.mock('../setting/setting.service.js', () => ({ getValue: vi.fn().mockResolvedValue(120) }));
import {
  assertCoursePaymentWindow,
  assertCourseSettlementWindow,
  paymentWindow,
} from './course-payment-window.service.js';
import { bankPaymentTime, parseSepayTime } from './sepay-time.js';

const deadline = new Date('2030-01-01T03:15:00.500Z');
const invoice = {
  id: 1,
  kind: 'COURSE',
  channel: 'ONLINE',
  expiresAt: deadline,
  createdAt: new Date('2030-01-01T03:00:00.500Z'),
};
const bankPaidAt = new Date('2030-01-01T03:14:59.000Z');
const millisecondsAfter = (ms) => new Date(deadline.getTime() + ms);

describe('TC-PAY-TIME: biên mili giây, timezone và deadline cố định', () => {
  it('TC-PAY-TIME-01: tại quầy chốt ở 14:59.999 được, tại đúng deadline bị từ chối', async () => {
    const counter = { ...invoice, channel: 'COUNTER' };
    await expect(
      assertCoursePaymentWindow(counter, {
        provider: 'COUNTER',
        now: millisecondsAfter(-1),
      }),
    ).resolves.toBeUndefined();
    await expect(
      assertCoursePaymentWindow(counter, {
        provider: 'COUNTER',
        now: deadline,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('TC-PAY-TIME-02: webhook đúng hạn ngân hàng được qua trong grace, mốc cuối grace bị từ chối', async () => {
    await expect(
      assertCoursePaymentWindow(invoice, {
        provider: 'SEPAY',
        paidAt: bankPaidAt,
        now: millisecondsAfter(1),
      }),
    ).resolves.toBeUndefined();
    await expect(
      assertCoursePaymentWindow(invoice, {
        provider: 'SEPAY',
        paidAt: bankPaidAt,
        now: millisecondsAfter(120000),
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('TC-PAY-TIME-03: timestamp chỉ có giây, cùng giây với deadline là không đủ chứng cứ khi nhận trễ', async () => {
    await expect(
      assertCoursePaymentWindow(invoice, {
        provider: 'SEPAY',
        paidAt: new Date('2030-01-01T03:15:00.000Z'),
        now: millisecondsAfter(1),
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('TC-PAY-TIME-04: không dùng khoảng chờ ngân hàng để thu tiền mặt hoặc số dư', async () => {
    for (const provider of ['COUNTER', 'CREDIT', 'MANUAL'])
      await expect(
        assertCoursePaymentWindow(invoice, {
          provider,
          now: millisecondsAfter(1),
          paidAt: bankPaidAt,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('TC-PAY-TIME-05: không suy timestamp từ máy khách, timestamp ngân hàng đọc đúng UTC+7', () => {
    expect(parseSepayTime('2030-01-01 10:14:59')).toEqual(bankPaidAt);
    for (const value of ['2030-02-30 10:00:00', 'bad', '', undefined])
      expect(parseSepayTime(value)).toBeNull();
    expect(bankPaymentTime({ transactionDate: '2030-01-01 10:14:59' }, invoice, deadline)).toEqual({
      paidAt: bankPaidAt,
    });
    expect(
      bankPaymentTime({ transactionDate: '2030-01-01 10:15:01' }, invoice, deadline).error,
    ).toBeTruthy();
    expect(
      bankPaymentTime({ transactionDate: '2030-01-01 09:59:59' }, invoice, deadline).error,
    ).toBeTruthy();
  });
  it('TC-PAY-TIME-06: counter không có grace, khóa online có grace nhưng deadline không đổi', () => {
    expect(paymentWindow(invoice, 120)).toEqual({
      paymentDeadline: deadline,
      holdReleaseAt: millisecondsAfter(120000),
    });
    expect(paymentWindow({ ...invoice, channel: 'COUNTER' }, 120).holdReleaseAt).toEqual(deadline);
  });
  it('TC-PAY-TIME-07: quyết định trước hạn vẫn hợp lệ khi ghi hoàn tất sau hạn; không đổi mốc giữa transaction', async () => {
    const db = { payment: { findMany: vi.fn() } };
    await expect(
      assertCourseSettlementWindow(db, invoice, millisecondsAfter(-1)),
    ).resolves.toBeUndefined();
    expect(db.payment.findMany).not.toHaveBeenCalled();
  });
  it('TC-PAY-TIME-08: chấp nhận chuyển thừa sau hạn chỉ trong grace với payment đúng hạn', async () => {
    const db = { payment: { findMany: vi.fn().mockResolvedValue([{ paidAt: bankPaidAt }]) } };
    await expect(
      assertCourseSettlementWindow(db, invoice, millisecondsAfter(1)),
    ).resolves.toBeUndefined();
    db.payment.findMany.mockResolvedValue([{ paidAt: millisecondsAfter(1) }]);
    await expect(
      assertCourseSettlementWindow(db, invoice, millisecondsAfter(1)),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

it('TC-PAY-TIME-09: sổ tiền đã xác thực nhận trước hạn 1ms không mất tính hợp lệ trong grace', async () => {
  const db = {
    payment: { findMany: vi.fn().mockResolvedValue([{ paidAt: millisecondsAfter(-1) }]) },
  };
  await expect(
    assertCourseSettlementWindow(db, invoice, millisecondsAfter(1)),
  ).resolves.toBeUndefined();
});
