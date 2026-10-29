import { describe, expect, it } from 'vitest';
import { passwordChangeSchema, registerSchema } from './auth.validation.js';

describe('auth validation', () => {
  it('TC-F1-03: chuẩn hoá dữ liệu đăng ký', () => {
    const result = registerSchema.body.parse({
      email: ' Nhanh@Example.COM ',
      phone: '+84901234567',
      password: 'Password@123',
      fullName: 'Nguyễn Văn Nhanh',
    });
    expect(result.email).toBe('nhanh@example.com');
    expect(result.phone).toBe('0901234567');
  });

  it('TC-F1-04: từ chối mật khẩu mới trùng mật khẩu hiện tại', () => {
    const result = passwordChangeSchema.body.safeParse({
      currentPassword: 'Password@123',
      password: 'Password@123',
    });
    expect(result.success).toBe(false);
  });
});
