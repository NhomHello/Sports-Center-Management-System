import { describe, expect, it } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { canManagePurchase, validCancelPreview, validChangePreview } from './CancelPurchasePolicy';

describe('TC-UI-GY34: quyền và preview an toàn', () => {
  it('không coi loading hoặc dữ liệu tiền sai là preview hợp lệ', () => {
    for (const value of [null, {}, { paidAmount: '1200000' }])
      expect(validCancelPreview(value)).toBe(false);
    expect(
      validCancelPreview({
        paidAmount: 1200000,
        remainingValue: 800000,
        fee: 80000,
        refundAmount: 720000,
      }),
    ).toBe(true);
    expect(
      validChangePreview({ remainingValue: 800000, newPrice: 1500000, difference: 700000 }),
    ).toBe(true);
    expect(
      validChangePreview({ remainingValue: 800000, newPrice: 600000, difference: -200000 }),
    ).toBe(true);
    expect(validChangePreview({ remainingValue: 800000, newPrice: 600000, difference: NaN })).toBe(
      false,
    );
  });
  it('quyền chính chủ không áp dụng cho hội viên khác', () => {
    const can = (permission) => permission === P.MEMBERSHIP_PURCHASE;
    expect(canManagePurchase({ kind: 'membership', ownerId: 1, userId: 1, can })).toBe(true);
    expect(canManagePurchase({ kind: 'membership', ownerId: 2, userId: 1, can })).toBe(false);
    expect(canManagePurchase({ kind: 'membership', ownerId: undefined, userId: 1, can })).toBe(
      false,
    );
  });
  it('hủy khóa hộ yêu cầu quyền thao tác hộ', () => {
    const can = (permission) => permission === P.CLASS_CANCEL_SELF;
    expect(canManagePurchase({ kind: 'enrollment', ownerId: 1, userId: 1, can })).toBe(true);
    expect(canManagePurchase({ kind: 'enrollment', ownerId: 2, userId: 1, can })).toBe(false);
  });
});
