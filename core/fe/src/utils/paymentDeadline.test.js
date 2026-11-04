import { describe, expect, it } from 'vitest';
import { canCollectCash, cashDue, coursePaymentExpired, invoiceStatusMeta } from './invoice';
const deadline = '2030-01-01T10:15:00.000Z';
const now = new Date(deadline).getTime();
const invoice = {
  kind: 'COURSE',
  status: 'PENDING',
  channel: 'ONLINE',
  amount: 300000,
  expiresAt: deadline,
  paymentDeadline: deadline,
  holdReleaseAt: '2030-01-01T10:17:00.000Z',
};
describe('Hạn chuyển tiền và khoảng chờ ngân hàng là hai mốc khác nhau', () => {
  it('TC-PAY-DEADLINE-UI-01: hết hạn là khóa ngay, dù giữ chỗ còn chờ webhook', () => {
    expect(coursePaymentExpired(invoice, now - 1)).toBe(false);
    expect(coursePaymentExpired(invoice, now)).toBe(true);
    expect(invoiceStatusMeta(invoice, now).label).toBe(
      'Hết hạn chuyển tiền, chờ xác nhận ngân hàng',
    );
    expect(invoiceStatusMeta(invoice, now + 120000).label).toBe('Hết hạn giữ chỗ, chờ xử lý');
  });
  it('TC-PAY-DEADLINE-UI-02: không thu thêm tiền vào hóa đơn đã nhận thừa', () => {
    expect(
      canCollectCash({ invoice: { ...invoice, receivedAmount: 350000 }, canRecordCash: true }),
    ).toBe(false);
  });
  it('TC-PAY-DEADLINE-UI-03: tại quầy hết hạn khóa thu dù job vẫn để PENDING', () => {
    expect(
      canCollectCash({
        invoice: {
          ...invoice,
          channel: 'COUNTER',
          expiresAt: '2000-01-01',
          paymentDeadline: '2000-01-01',
        },
        canRecordCash: true,
      }),
    ).toBe(false);
  });
});

it('TC-PAY-DEADLINE-UI-04: tại quầy chỉ thu phần còn lại sau khi dùng số dư', () => {
  expect(cashDue({ channel: 'COUNTER', amount: 500000, receivedAmount: 200000 })).toBe(300000);
});
