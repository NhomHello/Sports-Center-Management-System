import { describe, expect, it } from 'vitest';
import { invoiceReceived, invoiceStatusMeta } from './invoice';

const NOW = Date.parse('2026-10-18T05:00:00Z');
const future = '2026-10-18T06:00:00Z';
const past = '2026-10-18T04:00:00Z';

describe('invoiceStatusMeta', () => {
  it.each([
    [
      'online chưa nhận tiền',
      { status: 'PENDING', channel: 'ONLINE', expiresAt: future },
      'Chờ chuyển khoản',
    ],
    ['tại quầy', { status: 'PENDING', channel: 'COUNTER', expiresAt: past }, 'Chờ thu tại quầy'],
    [
      'đã nhận một phần',
      {
        status: 'PENDING',
        channel: 'ONLINE',
        expiresAt: future,
        receivedAmount: 100000,
        amount: 120000,
      },
      'Chờ chuyển bù',
    ],
    [
      'online quá hạn nhưng job chưa chạy',
      { status: 'PENDING', channel: 'ONLINE', expiresAt: past },
      'Đã hủy (quá hạn)',
    ],
    [
      'chuyển thừa chờ quản lý xác nhận, kể cả đã quá hạn',
      {
        status: 'PENDING',
        channel: 'ONLINE',
        expiresAt: past,
        receivedAmount: 200000,
        amount: 100000,
      },
      'Chuyển thừa, chờ xác nhận',
    ],
    [
      'đã báo chuyển khoản, chờ trung tâm kiểm tra',
      { status: 'PENDING', channel: 'ONLINE', expiresAt: future, cases: [{ status: 'OPEN' }] },
      'Đã báo chuyển, chờ kiểm tra',
    ],
    [
      'báo chuyển bị từ chối trên hóa đơn đã hủy',
      { status: 'FAILED', channel: 'ONLINE', expiresAt: past, cases: [{ status: 'REJECTED' }] },
      'Báo chuyển bị từ chối',
    ],
    ['đã thanh toán', { status: 'PAID', channel: 'ONLINE' }, 'Đã thanh toán'],
  ])('%s', (_name, invoice, label) => {
    expect(invoiceStatusMeta(invoice, NOW).label).toBe(label);
  });
});

describe('invoiceReceived', () => {
  it('ưu tiên receivedAmount, nếu không có thì cộng các payment', () => {
    expect(invoiceReceived({ receivedAmount: 5 })).toBe(5);
    expect(invoiceReceived({ payments: [{ receivedAmount: 2 }, { receivedAmount: 3 }] })).toBe(5);
    expect(invoiceReceived({})).toBe(0);
  });
});
