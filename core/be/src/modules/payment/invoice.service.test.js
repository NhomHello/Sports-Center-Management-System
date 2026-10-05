import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findCollectors: vi.fn(),
  getValue: vi.fn(),
}));

vi.mock('../../config/db.js', () => ({
  Enums: { InvoiceStatus: { PAID: 'PAID' } },
  prisma: {
    invoice: { findFirst: mocks.findFirst },
    user: { findMany: mocks.findCollectors },
  },
}));
vi.mock('../setting/setting.service.js', () => ({ getValue: mocks.getValue }));

const { getInvoice, getReceipt } = await import('./invoice.service.js');

describe('invoice access', () => {
  it('TC-F3-03: ẩn hoá đơn khi người gọi không phải chủ sở hữu', async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(getInvoice(1, { id: 3 }, false)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('TC-F3-04: chỉ tạo dữ liệu bản in từ hoá đơn đã thanh toán', async () => {
    mocks.findFirst.mockResolvedValue({ id: 1, userId: 2, status: 'PENDING', payments: [] });
    mocks.findCollectors.mockResolvedValue([]);
    await expect(getReceipt(1, { id: 2 }, false)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('TC-F3-05: bản in dùng số tiền gốc và cấu hình trung tâm', async () => {
    mocks.findFirst.mockResolvedValue({
      id: 1,
      userId: 2,
      status: 'PAID',
      amount: 500000,
      payments: [],
    });
    mocks.findCollectors.mockResolvedValue([]);
    mocks.getValue
      .mockResolvedValueOnce('SCMS')
      .mockResolvedValueOnce('HCM')
      .mockResolvedValueOnce('0900000000')
      .mockResolvedValueOnce('VND');
    const receipt = await getReceipt(1, { id: 2 }, false);
    expect(receipt.invoice.amount).toBe(500000);
    expect(receipt.center.name).toBe('SCMS');
    expect(receipt.currency).toBe('VND');
  });
});
