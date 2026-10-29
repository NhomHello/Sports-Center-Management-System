import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { getFreezeLimits, getFreezeRangeError } from './membershipFreeze';
const dates = (from, to) => [dayjs(from), dayjs(to)];
describe('Live freeze limits after integration', () => {
  it('TC-S4-KHAI-FREEZE-01: never invents policy or budget when fields are missing', () => {
    expect(getFreezeLimits({ freezeDaysUsed: 20, freezeDaysLeft: 40 })).toBeNull();
    expect(
      getFreezeLimits({ freezeMinDays: 7, freezeDaysUsed: -1, freezeDaysLeft: 40 }),
    ).toBeNull();
    expect(getFreezeRangeError(dates('2026-10-01', '2026-10-10'), null)).toContain('Chưa tải đủ');
  });
  it('TC-S4-KHAI-FREEZE-02: honors configured min days and remaining days at boundaries', () => {
    const limits = getFreezeLimits({ freezeMinDays: 9, freezeDaysUsed: 20, freezeDaysLeft: 40 });
    expect(getFreezeRangeError(dates('2026-10-01', '2026-10-09'), limits)).toBe(
      'Chọn từ 9 đến 40 ngày',
    );
    expect(getFreezeRangeError(dates('2026-10-01', '2026-10-10'), limits)).toBeNull();
    expect(getFreezeRangeError(dates('2026-10-01', '2026-11-10'), limits)).toBeNull();
    expect(getFreezeRangeError(dates('2026-10-01', '2026-11-11'), limits)).toBeTruthy();
    expect(getFreezeRangeError([], limits)).toBe('Chọn khoảng bảo lưu');
  });
});
