import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getValue: vi.fn() }));

vi.mock('../../config/db.js', () => ({
  Enums: {
    InvoiceStatus: { PENDING: 'PENDING', PAID: 'PAID' },
    InvoiceChannel: { ONLINE: 'ONLINE', COUNTER: 'COUNTER' },
  },
}));
vi.mock('../setting/setting.service.js', () => ({ getValue: mocks.getValue }));

const { buildPaymentInstruction } = await import('./sepay-qr.service.js');

const invoice = {
  code: 'INV000012',
  amount: 450000,
  channel: 'ONLINE',
  status: 'PENDING',
  expiresAt: new Date('2026-10-13T10:00:00Z'),
};
const configure = (values) => mocks.getValue.mockImplementation(async (key) => values[key] ?? '');

describe('buildPaymentInstruction', () => {
  beforeEach(() => mocks.getValue.mockReset());

  it('dựng QR từ tài khoản cấu hình trong system_settings', async () => {
    configure({
      PAYMENT_BANK_CODE: 'ACB',
      PAYMENT_ACCOUNT_NUMBER: '0000000001',
      PAYMENT_ACCOUNT_NAME: 'LE DUC NHANH',
    });
    const result = await buildPaymentInstruction(invoice);
    const qr = new URL(result.qrUrl);
    expect(qr.searchParams.get('acc')).toBe('0000000001');
    expect(qr.searchParams.get('bank')).toBe('ACB');
    expect(qr.searchParams.get('amount')).toBe('450000');
    expect(qr.searchParams.get('des')).toBe('INV000012');
    expect(result.accountName).toBe('LE DUC NHANH');
  });

  it('trả null khi chưa cấu hình tài khoản nhận tiền', async () => {
    configure({});
    expect(await buildPaymentInstruction(invoice)).toBeNull();
  });

  it('trả null với hoá đơn tại quầy hoặc đã thanh toán', async () => {
    configure({ PAYMENT_BANK_CODE: 'ACB', PAYMENT_ACCOUNT_NUMBER: '0000000001' });
    expect(await buildPaymentInstruction({ ...invoice, channel: 'COUNTER' })).toBeNull();
    expect(await buildPaymentInstruction({ ...invoice, status: 'PAID' })).toBeNull();
  });
});
