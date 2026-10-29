import { describe, expect, it } from 'vitest';
import { computeSavings, pricePerDay } from './planPricing';

const PLANS = [
  { id: 1, price: 360000, durationDays: 30, isActive: true },
  { id: 2, price: 900000, durationDays: 90, isActive: true },
  { id: 3, price: 2880000, durationDays: 365, isActive: true },
];

describe('planPricing', () => {
  it('tính đơn giá mỗi ngày', () => {
    expect(pricePerDay(PLANS[0])).toBe(12000);
    expect(pricePerDay(PLANS[2])).toBe(7890);
  });

  it('tiết kiệm so với gói ngắn nhất, gói gốc không có nhãn', () => {
    const savings = computeSavings(PLANS);
    expect(savings.get(1)).toBeUndefined();
    expect(savings.get(2)).toBe(17);
    expect(savings.get(3)).toBe(34);
  });

  it('bỏ qua gói ngừng bán và không đủ gói để so sánh', () => {
    expect(computeSavings([PLANS[0]]).size).toBe(0);
    expect(computeSavings([PLANS[0], { ...PLANS[1], isActive: false }]).size).toBe(0);
  });

  it('không gắn nhãn khi gói dài không rẻ hơn mỗi ngày', () => {
    const flat = [PLANS[0], { id: 9, price: 1080000, durationDays: 90, isActive: true }];
    expect(computeSavings(flat).size).toBe(0);
  });
});
