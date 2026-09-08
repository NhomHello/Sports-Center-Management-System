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
    env: { NODE_ENV: 'test' },
    fileParallelism: false,
    testTimeout: TEST_TIMEOUT_MS,
  },
});
