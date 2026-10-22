import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from './http';
import * as purchase from './purchase.service';

vi.mock('./http', () => ({ http: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

describe('Hợp đồng GY-31/34/41', () => {
  it('TC-UI-GY31-01: báo nghỉ chính mình không gửi memberId giả', () => {
    purchase.excuseSession(7);
    expect(http.post).toHaveBeenCalledWith('/classes/sessions/7/excuse', {});
  });
  it('TC-UI-GY31-02: báo nghỉ hộ gửi đúng hội viên', () => {
    purchase.excuseSession(7, 15);
    expect(http.post).toHaveBeenCalledWith('/classes/sessions/7/excuse', { memberId: 15 });
  });
  it.each(['membership', 'enrollment'])(
    'TC-UI-GY34-01: preview và hủy %s đúng tài nguyên',
    (kind) => {
      const base = kind === 'membership' ? '/memberships/8' : '/enrollments/8';
      const data = { settlement: 'CREDIT', reason: 'Thay đổi lịch làm việc' };
      purchase.previewCancellation(kind, 8);
      purchase.cancelPurchase(kind, 8, data);
      expect(http.get).toHaveBeenCalledWith(`${base}/cancel-preview`);
      expect(http.post).toHaveBeenCalledWith(`${base}/cancel`, data);
    },
  );
  it.each([
    ['membership', 'memberships', 'planId'],
    ['enrollment', 'enrollments', 'classId'],
  ])('TC-UI-GY34-02: đổi %s chỉ gửi đích, không tính tiền ở FE', (kind, resource, key) => {
    purchase.previewChange(kind, 8, 9);
    purchase.changePurchase(kind, 8, { [key]: 9, settlement: 'REFUND' });
    expect(http.get).toHaveBeenCalledWith(`/${resource}/8/change-preview`, {
      params: { [key]: 9 },
    });
    expect(http.post).toHaveBeenCalledWith(`/${resource}/8/change`, {
      [key]: 9,
      settlement: 'REFUND',
    });
  });
  it('TC-UI-GY34-03: không tạo request cho loại giao dịch không biết', () => {
    expect(() => purchase.previewCancellation('unknown', 8)).toThrow(TypeError);
    expect(http.get).not.toHaveBeenCalled();
  });
  it('TC-UI-GY41-01: tải chi tiết bảo lưu từ kỳ gói', () => {
    purchase.getPurchaseMembership(8);
    expect(http.get).toHaveBeenCalledWith('/memberships/8');
  });
});
