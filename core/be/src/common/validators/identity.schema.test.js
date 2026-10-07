import { describe, expect, it } from 'vitest';
import { emailSchema, normalizePhone, phoneSchema } from './identity.schema.js';

describe('identity schemas', () => {
  it('TC-F1-01: chuẩn hoá email và số điện thoại trước khi lưu', () => {
    expect(emailSchema.parse('  USER@Example.COM ')).toBe('user@example.com');
    expect(phoneSchema.parse('+84901234567')).toBe('0901234567');
    expect(normalizePhone('090-123-4567')).toBe('0901234567');
  });

  it('TC-F1-02: từ chối số điện thoại không hợp lệ', () => {
    expect(phoneSchema.safeParse('123').success).toBe(false);
  });
});
