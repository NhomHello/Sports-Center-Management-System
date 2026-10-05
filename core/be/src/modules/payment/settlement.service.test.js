import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/db.js', () => ({
  Enums: {
    MembershipStatus: { ACTIVE: 'ACTIVE', EXPIRED: 'EXPIRED' },
    InvoiceStatus: { PENDING: 'PENDING' },
    PaymentProvider: { COUNTER: 'COUNTER' },
  },
}));

const { settleCounterInvoice } = await import('./settlement.service.js');

const invoice = {
  id: 10,
  userId: 20,
  planId: 30,
  amount: 500000,
  status: 'PENDING',
  plan: { durationDays: 30 },
};

const createTx = () => ({
  invoice: { updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn() },
  membership: {
    findFirst: vi.fn().mockResolvedValue(null),
    updateMany: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 40 }),
    update: vi.fn(),
  },
  payment: { create: vi.fn().mockResolvedValue({ id: 50 }) },
});

describe('settleCounterInvoice', () => {
  let tx;

  beforeEach(() => {
    tx = createTx();
  });

  it('TC-F3-01: từ chối số tiền thực thu khác giá trên hoá đơn', async () => {
    await expect(
      settleCounterInvoice({ invoice, receivedAmount: 499999, actorId: 1, tx }),
    ).rejects.toMatchObject({ statusCode: 422 });
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it('TC-F3-02: ghi payment và tạo membership trong cùng transaction', async () => {
    const result = await settleCounterInvoice({
      invoice,
      receivedAmount: invoice.amount,
      reference: 'CASH-001',
      actorId: 1,
      tx,
    });
    expect(result.payment.id).toBe(50);
    expect(result.membership.id).toBe(40);
    expect(tx.invoice.updateMany).toHaveBeenCalledOnce();
    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: invoice.id },
      data: { membershipId: 40 },
    });
  });
});
