import { describe, expect, it } from 'vitest';
import { MS_PER_DAY } from '@/constants';
import { computeMembershipEffect, MEMBERSHIP_EFFECT } from './membershipEffect';

const NOW = Date.parse('2026-10-13T00:00:00Z');
const at = (days) => new Date(NOW + days * MS_PER_DAY).toISOString();

describe('computeMembershipEffect', () => {
  it('chưa có gói: bắt đầu từ ngày thu tiền', () => {
    const effect = computeMembershipEffect(null, 30, NOW);
    expect(effect.kind).toBe(MEMBERSHIP_EFFECT.NEW);
    expect(effect.nextStart).toBe(NOW);
    expect(effect.nextEnd).toBe(NOW + 30 * MS_PER_DAY);
  });

  it('còn hạn: cộng dồn vào cuối gói hiện tại', () => {
    const effect = computeMembershipEffect({ endDate: at(10), plan: { name: 'Gói A' } }, 30, NOW);
    expect(effect.kind).toBe(MEMBERSHIP_EFFECT.EXTEND);
    expect(effect.nextEnd).toBe(NOW + 40 * MS_PER_DAY);
    expect(effect.planName).toBe('Gói A');
  });

  it('đã hết hạn: tạo gói mới từ ngày thu, không cộng dồn', () => {
    const effect = computeMembershipEffect({ endDate: at(-1), plan: { name: 'Gói A' } }, 30, NOW);
    expect(effect.kind).toBe(MEMBERSHIP_EFFECT.RENEW_AFTER_EXPIRED);
    expect(effect.nextStart).toBe(NOW);
    expect(effect.nextEnd).toBe(NOW + 30 * MS_PER_DAY);
  });

  it('đúng thời điểm hết hạn coi là đã hết hạn', () => {
    const effect = computeMembershipEffect({ endDate: at(0) }, 30, NOW);
    expect(effect.kind).toBe(MEMBERSHIP_EFFECT.RENEW_AFTER_EXPIRED);
  });
});
