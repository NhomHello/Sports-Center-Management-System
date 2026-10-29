import { test, expect } from '@playwright/test';
import { env } from '../../core/be/src/config/env.js';
import { login } from './helpers/ui.mjs';

const demoEmails = [
  'letan@scms.local',
  'coach.yoga@scms.local',
  'coach.gym@scms.local',
  'member1@scms.local',
];

for (const hostname of ['localhost', '127.0.0.1']) {
  test(`TC-LOCAL-AUTH: đăng nhập tài khoản demo từ ${hostname}`, async ({
    browser,
    baseURL,
  }, info) => {
    const address = new URL('/schedule', baseURL);
    address.hostname = hostname;
    for (const email of demoEmails) {
      // Context riêng tránh token và request tải quyền của tài khoản trước.
      const context = await browser.newContext({ viewport: info.project.use.viewport });
      try {
        const page = await context.newPage();
        await login(page, { email }, env.SEED_MOCK_PASSWORD, address.href);
        await expect(page.getByRole('heading', { name: 'Lớp học và lịch tập' })).toBeVisible();
        await expect(page.getByText('Không thể kết nối máy chủ, vui lòng thử lại')).toHaveCount(0);
      } finally {
        await context.close();
      }
    }
  });
}
