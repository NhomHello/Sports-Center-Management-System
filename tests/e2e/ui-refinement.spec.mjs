import { test, expect } from '@playwright/test';
import { login } from './helpers/ui.mjs';
const roles = [
  ['manager', () => process.env.SEED_ADMIN_EMAIL, () => process.env.SEED_ADMIN_PASSWORD],
  ['reception', () => 'letan@scms.local', () => process.env.SEED_MOCK_PASSWORD || 'Member@123'],
  ['coach', () => 'coach.yoga@scms.local', () => process.env.SEED_MOCK_PASSWORD || 'Member@123'],
  ['member', () => 'member1@scms.local', () => process.env.SEED_MOCK_PASSWORD || 'Member@123'],
];
async function theme(page, mode) {
  await page.getByRole('button', { name: /Giao diện:/ }).click();
  await page
    .getByRole('menuitemradio', { name: mode === 'dark' ? 'Tối' : 'Sáng', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
}
async function noOverflow(page) {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
}
for (const [role, email, password] of roles)
  for (const mode of ['light', 'dark']) {
    test(`${role} ${mode}: theme, class cards and accessible account menu`, async ({
      page,
    }, info) => {
      await login(page, { email: email() }, password());
      await theme(page, mode);
      await noOverflow(page);
      const trigger = page.getByRole('button', { name: /Mở menu tài khoản:/ });
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('.scms-account-menu__identity')).toContainText(email());
      await page.getByRole('menuitem', { name: 'Hồ sơ cá nhân' }).focus();
      await page.keyboard.press('Escape');
      await expect(page.locator('.ant-picker-dropdown:visible')).toHaveCount(0);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await page.screenshot({
        path: info.outputPath(`${role}-${mode}-classes.png`),
        fullPage: true,
      });
      if (role !== 'coach') {
        await page.goto('/membership-plans');
        await expect(page.getByRole('heading', { name: 'Gói tập', exact: true })).toBeVisible();
        await expect(page.locator('.scms-plan-card').first()).toBeVisible();
        await noOverflow(page);
        await expect(page.locator('.scms-pricing-assurance')).toContainText('Lớp học bán riêng');
        const ribbon = await page.locator('.scms-plan-card__ribbon').boundingBox();
        const heading = await page.locator('.scms-membership-catalog-heading').boundingBox();
        expect(ribbon.y).toBeGreaterThanOrEqual(heading.y + heading.height);
        await page.screenshot({
          path: info.outputPath(`${role}-${mode}-plans.png`),
          fullPage: true,
        });
      }
    });
  }
for (const mode of ['light', 'dark'])
  for (const width of [320, 768, 1366, 1920]) {
    test(`member ${mode} ${width}: attendance filters reset, calendar popup and layout`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 1000 });
      await login(
        page,
        { email: 'member1@scms.local' },
        process.env.SEED_MOCK_PASSWORD || 'Member@123',
      );
      await theme(page, mode);
      await page.goto('/attendance');
      await expect(
        page.getByRole('heading', { name: 'Lịch sử điểm danh', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).first(),
      ).toBeDisabled();
      await page.getByRole('spinbutton', { name: 'Mã lớp', exact: true }).fill('999999');
      await expect(
        page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).first(),
      ).toBeEnabled();
      await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).first().click();
      await expect(page.getByRole('spinbutton', { name: 'Mã lớp', exact: true })).toHaveValue('');
      await page.getByPlaceholder('Từ ngày', { exact: true }).click();
      const popup = page.locator('.scms-range-popup:visible');
      await expect(popup).toBeVisible();
      const bounds = await popup.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(-1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      await page.keyboard.press('Escape');
      await expect(page.locator('.ant-picker-dropdown:visible')).toHaveCount(0);
      await noOverflow(page);
      await page.screenshot({
        path: info.outputPath(`member-${mode}-${width}-attendance.png`),
        fullPage: true,
      });
      await page.goto('/membership-plans');
      await expect(page.locator('.scms-freeze-card')).toBeVisible();
      await noOverflow(page);
      await page.locator('.scms-freeze-form .ant-picker input').first().click();
      const freeze = page.locator('.scms-range-popup:visible');
      await expect(freeze).toBeVisible();
      const b = await freeze.boundingBox();
      expect(b.x).toBeGreaterThanOrEqual(-1);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 1);
      await page.keyboard.press('Escape');
      await expect(page.locator('.ant-picker-dropdown:visible')).toHaveCount(0);
      await page.screenshot({
        path: info.outputPath(`member-${mode}-${width}-plans.png`),
        fullPage: true,
      });
    });
  }
