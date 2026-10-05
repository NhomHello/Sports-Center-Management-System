import { expect } from '@playwright/test';

/** Tìm thẻ lớp hoặc tài nguyên qua tiêu đề hiển thị. */
export const card = (page, name) =>
  page
    .locator('.ant-card')
    .filter({ has: page.locator('.ant-card-head-title', { hasText: name }) });

/** Đăng nhập qua giao diện và xác nhận API thành công. */
export async function login(page, user, password) {
  await page.goto('/schedule');
  await page.getByLabel('Email hoặc số điện thoại', { exact: true }).fill(user.email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  const authenticated = page.waitForResponse(
    (r) => r.url().endsWith('/auth/login') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  expect((await authenticated).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Lớp học và lịch tập' })).toBeVisible();
}

/** Chọn ngày theo định dạng của picker hiện tại. */
export async function chooseDate(page, iso) {
  const input = page.locator('.ant-picker input').first();
  const sample = await input.inputValue();
  const value = /^\d{4}-/.test(sample) ? iso : iso.split('-').reverse().join('/');
  await input.fill(value);
  await input.press('Enter');
  await input.press('Tab');
}

/** Xác nhận booking và kiểm tra phản hồi ghi dữ liệu. */
export async function confirmBooking(page, source, { button, confirmation, method }) {
  const result = page.waitForResponse(
    (r) => r.url().includes('/enrollments') && r.request().method() === method,
  );
  await source.getByRole('button', { name: button, exact: true }).click();
  await page
    .locator('.ant-popconfirm')
    .getByRole('button', { name: confirmation, exact: true })
    .click();
  expect((await result).status()).toBe(method === 'POST' ? 201 : 200);
}

/** Chờ popup ổn định trước khi chọn đúng option theo tên đầy đủ. */
export async function selectOption(page, label, option) {
  await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0);
  await expect(page.locator('.ant-modal')).not.toHaveClass(/-(enter|appear)(?:\s|-)/);
  await page.getByLabel(label, { exact: true }).click();
  await expect(page.locator('.ant-select-dropdown:visible')).not.toHaveClass(
    /-(enter|appear)(?:\s|-)/,
  );
  const row = page
    .locator('.ant-select-dropdown:visible')
    .getByRole('option', { name: option, exact: true });
  await row.hover();
  await row.click();
  await expect(page.locator('.ant-select-content').filter({ hasText: option })).toHaveCount(1);
  await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0);
}

/** Điều hướng cùng một màn hình trên desktop hoặc mobile. */
export async function selectTab(page, name) {
  const navigation = page.getByRole('combobox', { name: 'Chọn màn hình lịch', exact: true });
  if (await navigation.isVisible()) {
    await expect(page.locator('.ant-select-dropdown:visible')).toHaveCount(0);
    await navigation.click();
    const dropdown = page.locator('.ant-select-dropdown:visible');
    await expect(dropdown).not.toHaveClass(/-(enter|appear)(?:\s|-)/);
    await dropdown.getByRole('option', { name, exact: true }).click();
    return;
  }
  const tab = page.getByRole('tab', { name, exact: true });
  if (await tab.isVisible()) {
    await tab.click();
    return;
  }
  await page.locator('.ant-tabs-nav-more').hover();
  await page.getByRole('menuitem', { name, exact: true }).click();
}
