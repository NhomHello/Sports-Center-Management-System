import { defineConfig } from '@playwright/test';
import base from '../../playwright.config.mjs';
export default defineConfig({
  ...base,
  webServer: base.webServer.map((server) => ({ ...server, cwd: process.cwd() })),
  testDir: '.',
  testMatch: [
    'ui-refinement.spec.mjs',
    'class-booking-flow.spec.mjs',
    'sepay-online.spec.mjs',
    'sprint3-khoi.spec.mjs',
  ],
  outputDir: '../../test-results/ui-refinement',
  reporter: [
    ['list'],
    ['json', { outputFile: process.cwd() + '/.cache/ui-khai/refinement-results.json' }],
  ],
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1440, height: 1000 } } },
  ],
});
