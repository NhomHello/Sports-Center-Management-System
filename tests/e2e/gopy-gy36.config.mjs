import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../..', import.meta.url));
const port = process.env.GOPY_FE_PORT || '5191';
const frontend = `http://127.0.0.1:${port}`;

// Bộ UI hợp đồng chạy riêng: không reset DB, không thay thế nghiệm thu API/DB thật GY-36.
export default defineConfig({
  testDir: '.',
  testMatch: 'gopy-gy36-contract.spec.mjs',
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  outputDir: path.join(root, 'test-results/gopy-khoi'),
  reporter: [['list'], ['json', { outputFile: path.join(root, '.cache/gopy-khoi/results.json') }]],
  use: {
    baseURL: frontend,
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Ho_Chi_Minh',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `"${process.execPath}" "${path.join(root, 'node_modules/vite/bin/vite.js')}" --host 127.0.0.1 --port ${port} --strictPort`,
    cwd: path.join(root, 'core/fe'),
    url: frontend,
    reuseExistingServer: false,
    env: { VITE_API_URL: `${frontend}/api/v1`, VITE_PORT: port },
    timeout: 60000,
  },
});
