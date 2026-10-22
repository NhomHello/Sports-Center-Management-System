import { ERROR_CODES } from '@scms/shared';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllEnvs());

describe('Rate limit response contract', () => {
  it('trả JSON tiếng Việt rõ ràng khi đăng nhập quá nhiều lần', async () => {
    // Vitest mặc định nới AUTH_RATE_LIMIT_MAX cho test tích hợp khác.
    // Tạo app riêng với ngưỡng thấp để không gửi 1000 request và tránh phụ thuộc DB.
    vi.stubEnv('AUTH_RATE_LIMIT_MAX', '3');
    vi.resetModules();
    const { app } = await import('../src/app.js');
    const { env } = await import('../src/config/env.js');
    const api = request(app);
    const path = `${env.API_PREFIX}/auth/login`;

    for (let attempt = 0; attempt < env.AUTH_RATE_LIMIT_MAX; attempt += 1) {
      const response = await api.post(path).send({});
      expect(response.status).toBe(400);
    }

    const limited = await api.post(path).send({});
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(limited.body.message).toContain('thử lại sau');
  });
});
