import { expect } from 'vitest';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../src/config/db.js';
import { asManager } from './reconciliation.js';
import { contactCase } from './payment-deadline.js';

export const FUNDED_REASONS = ['UNDERPAID', 'OVERPAID'];
/** Các phiếu có tiền đã ghi vào sổ Payment, không gồm khoản chuyển trễ/chuyển lặp chưa gán. */
export const fundedCases = (invoice) =>
  prisma.reconciliationCase.findMany({
    where: { invoiceId: invoice.id, reason: { in: FUNDED_REASONS } },
    orderBy: { id: 'asc' },
  });
/** Tạo yêu cầu hoàn sau khi lưu liên hệ; chưa đánh dấu đã trả tiền. */
export const requestRefund = async (f, kase) => {
  await contactCase(f, kase.id);
  const response = await asManager(f, 'post', `/reconciliations/${kase.id}/refund`, {
    reason: 'Hoàn theo thỏa thuận',
  });
  expect(response.status).toBe(StatusCodes.CREATED);
  return response.body.data;
};
/** Chuyển trạng thái hoàn tất bằng tham chiếu giả lập, chỉ dùng cho fixture. */
export const finishRefund = async (f, refund) => {
  const response = await asManager(f, 'post', `/refunds/${refund.id}/complete`, {
    reference: `TEST-REFUND-${refund.id}`,
  });
  expect(response.status).toBe(StatusCodes.OK);
  return response.body.data;
};
