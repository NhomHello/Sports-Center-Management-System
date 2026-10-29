import { afterEach, describe, expect, it, vi } from 'vitest';
import { memberBody } from './profile.validation.js';
afterEach(() => vi.useRealTimers());
describe('ngày sinh theo lịch Việt Nam', () => {
  it('đầu ngày Việt Nam vẫn nhận ngày hôm nay dù UTC còn ở ngày trước', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T17:30:00Z'));
    expect(memberBody.safeParse({ birthDate: '2026-10-29' }).success).toBe(true);
    expect(memberBody.safeParse({ birthDate: '2026-10-30' }).success).toBe(false);
    expect(memberBody.safeParse({ birthDate: null }).success).toBe(true);
  });
});
