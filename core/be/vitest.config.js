import { defineConfig } from 'vitest/config';

// Test tich hop chay tren DB dev (docker). Nap .env roi ep NODE_ENV=test (tat log).
try {
  process.loadEnvFile('.env');
} catch {
  // Khong co .env => env.js se bao thieu bien ro rang
}

const TEST_TIMEOUT_MS = 15000;

export default defineConfig({
  test: {
    include: ['src/**/*.test.js', 'tests/**/*.test.js'],
    // Test gọi đăng ký/đăng nhập liên tục từ một IP nên nới giới hạn chống brute-force.
    env: { NODE_ENV: 'test', AUTH_RATE_LIMIT_MAX: '1000' },
    fileParallelism: false,
    testTimeout: TEST_TIMEOUT_MS,
  },
});
