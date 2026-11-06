import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertRescheduleNotice } from './class-reschedule-policy.service.js';
import { getValue } from '../setting/setting.service.js';

vi.mock('../setting/setting.service.js', () => ({ getValue: vi.fn().mockResolvedValue(48) }));
afterEach(() => vi.clearAllMocks());

describe('Reschedule notice boundary', () => {
  const now = new Date('2026-11-06T00:00:00Z');
  it('allows exactly 48 hours, rejects a millisecond less for either start', async () => {
    const exact = new Date('2026-11-08T00:00:00Z');
    const short = new Date(exact.getTime() - 1);
    await expect(assertRescheduleNotice([exact, exact], now)).resolves.toBeUndefined();
    await expect(assertRescheduleNotice([short, exact], now)).rejects.toMatchObject({
      statusCode: 422,
    });
    await expect(assertRescheduleNotice([exact, short], now)).rejects.toMatchObject({
      statusCode: 422,
    });
  });
  it('uses the configured longer notice period', async () => {
    getValue.mockResolvedValueOnce(72);
    await expect(assertRescheduleNotice([new Date('2026-11-08T12:00:00Z')], now)).rejects.toThrow(
      '72',
    );
  });
});
