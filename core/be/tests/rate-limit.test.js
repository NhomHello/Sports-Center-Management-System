import { ERROR_CODES } from '@scms/shared';
import { describe, expect, it } from 'vitest';
import { env } from '../src/config/env.js';
import { api, apiPath } from './helpers/api.js';

describe('Rate limit response contract', () => {
  it('trả JSON tiếng Việt rõ ràng khi đăng nhập quá nhiều lần', async () => {
    for (let attempt = 0; attempt < env.AUTH_RATE_LIMIT_MAX; attempt += 1) {
      await api
        .post(apiPath('/auth/login'))
        .send({ email: 'rate-limit-test@scms.local', password: 'incorrect' });
    }
    const limited = await api
      .post(apiPath('/auth/login'))
      .send({ email: 'rate-limit-test@scms.local', password: 'incorrect' });
    expect(limited.status).toBe(429);
    expect(limited.body.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(limited.body.message).toContain('thử lại sau');
  });
});
