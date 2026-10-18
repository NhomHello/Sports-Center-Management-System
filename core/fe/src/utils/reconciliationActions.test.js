import { describe, expect, it } from 'vitest';
import { caseActions } from './reconciliationActions';

const base = { status: 'OPEN', contacts: [], refunds: [], webhookLog: { id: 1 } };

describe('caseActions', () => {
  it('sai mã: gán, hoàn hoặc bỏ qua; bỏ qua không bao giờ là lựa chọn duy nhất', () => {
    const a = caseActions({ ...base, reason: 'NO_MATCH' });
    expect([a.map, a.refund, a.ignore]).toEqual([true, true, true]);
  });
  it('hội viên báo đã chuyển: xác nhận/từ chối, không hoàn, cần liên hệ trước', () => {
    const a = caseActions({ ...base, reason: 'MEMBER_CLAIM', invoiceId: 3 });
    expect([a.confirm, a.reject, a.refund, a.needsContact]).toEqual([true, true, false, true]);
  });
  it('quá hạn chuyển bù (REFUND_PENDING, chưa có yêu cầu hoàn) vẫn tạo được yêu cầu hoàn', () => {
    const a = caseActions({ ...base, status: 'REFUND_PENDING', reason: 'UNDERPAID', invoiceId: 3 });
    expect([a.active, a.refund, a.confirm]).toEqual([true, true, true]);
  });
  it('đang chờ chuyển trả thì không cho dùng lại khoản tiền', () => {
    const a = caseActions({
      ...base,
      status: 'REFUND_PENDING',
      reason: 'OVERPAID',
      refunds: [{ id: 9, status: 'PENDING' }],
    });
    expect(a.pendingRefund?.id).toBe(9);
    expect([a.refund, a.renew]).toEqual([false, false]);
  });
  it('phiếu đã đóng không còn thao tác', () => {
    const a = caseActions({ ...base, status: 'MATCHED', reason: 'NO_MATCH' });
    expect([a.active, a.map, a.refund, a.ignore]).toEqual([false, false, false, false]);
  });
  it('chuyển thừa: hóa đơn chờ chấp nhận thì chỉ chấp nhận hoặc hoàn, chưa gia hạn', () => {
    const awaiting = caseActions({ ...base, reason: 'OVERPAID', invoice: { status: 'PENDING' } });
    expect([awaiting.accept, awaiting.renew, awaiting.refund]).toEqual([true, false, true]);
    const accepted = caseActions({ ...base, reason: 'OVERPAID', invoice: { status: 'PAID' } });
    expect([accepted.accept, accepted.renew]).toEqual([false, true]);
  });
});
