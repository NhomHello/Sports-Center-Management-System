import { describe, expect, it } from 'vitest';
import { formatDateTime } from './format';

describe('formatDateTime', () => {
  it('formats API timestamps in Vietnam time', () => {
    expect(formatDateTime('2026-09-30T00:00:00.000Z')).toBe('30/09/2026 07:00');
  });

  it('returns an empty string for an absent timestamp', () => {
    expect(formatDateTime(null)).toBe('');
  });
});
