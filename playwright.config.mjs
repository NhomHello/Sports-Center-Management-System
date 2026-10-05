import { defineConfig } from '@playwright/test';
process.loadEnvFile('core/be/.env');
process.env.NODE_ENV = 'test';
const apiPort = process.env.E2E_API_PORT || '3100';
const fePort = process.env.E2E_FE_PORT || '5180';
process.env.PORT = apiPort;
const frontend = `http://127.0.0.1:${fePort}`;
const backend = `http://127.0.0.1:${apiPort}`;
const apiUrl = `${backend}${process.env.API_PREFIX || '/api/v1'}`;
// Dùng cấu hình CORS thật, chỉ đổi cổng cho server test để không che lỗi demo.
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .filter((origin) => origin.trim())
  .map((origin) => {
    const url = new URL(origin.trim());
    if (['localhost', '127.0.0.1'].includes(url.hostname)) url.port = fePort;
    return url.origin;
  })
  .join(',');
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: frontend, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1366, height: 900 } } },
    { name: 'mobile-320', use: { browserName: 'chromium', viewport: { width: 320, height: 780 } } },
  ],
  webServer: [
    {
      command: 'node --env-file-if-exists=core/be/.env core/be/src/server.js',
      url: `${apiUrl}/health`,
      env: { NODE_ENV: 'test', PORT: apiPort, CORS_ORIGINS: corsOrigins },
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: `npm run dev -w @scms/fe -- --host 127.0.0.1 --port ${fePort} --strictPort`,
      env: { VITE_API_URL: apiUrl, VITE_PORT: fePort },
      url: frontend,
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
