import { describe, it, expect } from 'vitest';
import { membershipWarning } from './membership-warning.js';
describe('BR-1.12 membership expiry warning', () => {
  const membership = { endDate: new Date('2026-10-20T00:00:00Z') };
  it('TC-F2-EXP-01: counts sessions on and after the expiry instant', () => {
    const sessions = ['2026-10-19', '2026-10-20', '2026-10-21'].map((date) => ({
      startAt: new Date(date),
    }));
    expect(membershipWarning(membership, sessions)).toMatchObject({
      membershipExpiresBeforeClassEnd: true,
      affectedSessionCount: 2,
    });
  });
  it('TC-F2-EXP-02: avoids warning when all sessions are covered', () => {
    expect(
      membershipWarning(membership, [{ startAt: new Date('2026-10-19') }]).affectedSessionCount,
    ).toBe(0);
    expect(membershipWarning(null, []).membershipExpiresBeforeClassEnd).toBe(false);
  });
});
