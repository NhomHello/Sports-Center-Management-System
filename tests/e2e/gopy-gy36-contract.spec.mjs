import { test, expect } from '@playwright/test';
import { openFixture } from './gopy-gy36-fixtures.mjs';

const dialog = (page) => page.getByRole('dialog');
const posts = (state, suffix) =>
  state.requests.filter((r) => r.method === 'POST' && r.path.endsWith(suffix));
const shot = (page, info, name) =>
  page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });

test('TC-UI-GY31-03: báo nghỉ giữ khóa và nhận tag Xin nghỉ', async ({ page }, info) => {
  const state = await openFixture(page);
  await page.getByRole('button', { name: 'Báo nghỉ', exact: true }).click();
  await dialog(page).getByRole('button', { name: 'Xác nhận báo nghỉ' }).click();
  await expect(page.getByText('Xin nghỉ', { exact: true })).toBeVisible();
  expect(posts(state, '/excuse')).toHaveLength(1);
  expect(posts(state, '/excuse')[0].body).toEqual({});
  expect(posts(state, '/cancel')).toHaveLength(0);
  expect(state.errors).toEqual([]);
  await shot(page, info, 'bao-nghi');
});

test('TC-UI-GY31-04: quá hạn và thiếu deadline không cho báo nghỉ', async ({ page }) => {
  await openFixture(page, { expired: true });
  await expect(page.getByText('Đã quá hạn báo nghỉ', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Báo nghỉ', exact: true })).toHaveCount(0);
});

test('TC-UI-GY34-06: hủy khóa nhận số dư và dùng thanh toán hóa đơn', async ({ page }, info) => {
  const state = await openFixture(page);
  await page.getByRole('button', { name: 'Hủy khóa học', exact: true }).click();
  await expect(dialog(page).getByText('720.000', { exact: false })).toBeVisible();
  await dialog(page).getByLabel('Ghi vào số dư').check();
  await dialog(page).getByLabel('Lý do hủy').fill('Thay đổi lịch làm việc');
  await dialog(page).getByRole('button', { name: 'Xác nhận hủy' }).click();
  await expect(dialog(page)).toHaveCount(0);
  await page.getByRole('button', { name: /Dùng số dư \(còn/ }).click();
  await dialog(page).getByRole('button', { name: 'Dùng số dư', exact: true }).click();
  await expect(page.getByText('PAID', { exact: true })).toBeVisible();
  expect(posts(state, '/cancel')[0].body).toEqual({
    settlement: 'CREDIT',
    reason: 'Thay đổi lịch làm việc',
  });
  expect(posts(state, '/apply-credit')[0].body).toEqual({});
  expect(state.errors).toEqual([]);
  await shot(page, info, 'so-du-thanh-toan');
});

test('TC-UI-GY34-07: đổi lớp lọc lớp hết chỗ, mở hóa đơn thu thêm', async ({ page }, info) => {
  const state = await openFixture(page);
  await page.getByRole('button', { name: 'Đổi lớp', exact: true }).click();
  await dialog(page).getByRole('combobox', { name: 'Lớp mới' }).click();
  await expect(page.getByText('Yoga đã đầy', { exact: true })).toHaveCount(0);
  await page.getByText('Yoga mới còn chỗ', { exact: true }).click();
  await expect(dialog(page).getByText(/700.000/)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect(page.getByTestId('location')).toHaveText('/payments?invoice=301');
  expect(posts(state, '/change')[0].body).toEqual({ classId: 22 });
  expect(state.context.course.enrollment.status).toBe('BOOKED');
  expect(state.errors).toEqual([]);
  await shot(page, info, 'doi-lop-cho-thu-them');
});

test('TC-UI-GY34-08: preview lỗi không xác nhận hủy', async ({ page }) => {
  const state = await openFixture(page, { previewError: true });
  await page.getByRole('button', { name: 'Hủy gói', exact: true }).click();
  await expect(dialog(page).getByText('Không được hủy giao dịch này')).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Xác nhận hủy' })).toBeDisabled();
  expect(posts(state, '/cancel')).toHaveLength(0);
});

test('TC-UI-GY34-09: preview sai kiểu tiền không dùng làm báo giá', async ({ page }) => {
  await openFixture(page, { badPreview: true });
  await page.getByRole('button', { name: 'Hủy gói', exact: true }).click();
  await expect(dialog(page).getByRole('button', { name: 'Xác nhận hủy' })).toBeDisabled();
  await expect(dialog(page).getByText(/Chưa có bảng tính hợp lệ/)).toBeVisible();
});

test('TC-UI-GY41-02: bảo lưu và kết thúc sớm đọc ngày từ BE', async ({ page }, info) => {
  const state = await openFixture(page);
  await expect(page.getByText('Đã bảo lưu 20 / 60 ngày')).toBeVisible();
  const inputs = page.locator('.ant-picker-range input');
  await inputs.nth(0).fill('21/10/2026');
  await inputs.nth(0).press('Tab');
  await inputs.nth(1).fill('01/11/2026');
  await inputs.nth(1).press('Tab');
  await page.getByRole('button', { name: 'Yêu cầu bảo lưu' }).click();
  await expect(page.getByText(/Đang bảo lưu đến/)).toBeVisible();
  await page.getByRole('button', { name: 'Kết thúc bảo lưu', exact: true }).click();
  await page.getByRole('button', { name: 'Kết thúc bảo lưu', exact: true }).last().click();
  await expect(page.getByText('Đã bảo lưu 22 / 60 ngày')).toBeVisible();
  expect(posts(state, '/freezes')[0].body).toEqual({ from: '2026-10-21', to: '2026-11-01' });
  expect(posts(state, '/resume')).toHaveLength(1);
  expect(state.errors).toEqual([]);
  await shot(page, info, 'bao-luu-ket-thuc-som');
});

test('TC-UI-GY41-03: thiếu policy live không tự mặc định 7 ngày', async ({ page }) => {
  await openFixture(page, { noPolicy: true });
  await expect(page.getByText(/Chưa tải đủ giới hạn bảo lưu/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Yêu cầu bảo lưu' })).toBeDisabled();
});

test('TC-UI-GY34-10: tài khoản không có quyền không hiện hành động', async ({ page }) => {
  const state = await openFixture(page, { denied: true });
  await expect(
    page.getByRole('button', {
      name: /Hủy gói|Đổi gói|Hủy khóa học|Đổi lớp|Báo nghỉ|Yêu cầu bảo lưu/,
    }),
  ).toHaveCount(0);
  expect(state.requests).toHaveLength(0);
  expect(state.errors).toEqual([]);
});

test('TC-UI-GY31-05: chưa có deadline không dùng hạn hủy toàn khóa', async ({ page }) => {
  await openFixture(page, { noDeadline: true });
  await expect(page.getByText('Chưa có hạn báo nghỉ từ hệ thống.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Báo nghỉ', exact: true })).toHaveCount(0);
});

test('TC-UI-GY34-11: lỗi hủy từ BE giữ hộp và lý do để xử lý lại', async ({ page }) => {
  const state = await openFixture(page, { cancelError: true });
  await page.getByRole('button', { name: 'Hủy khóa học', exact: true }).click();
  await dialog(page).getByLabel('Nhận tiền hoàn', { exact: true }).check();
  await dialog(page).getByLabel('Lý do hủy').fill('Không thể tiếp tục');
  await dialog(page).getByRole('button', { name: 'Xác nhận hủy' }).click();
  await expect(dialog(page).getByText('Khóa đã kết thúc, không thể hủy')).toBeVisible();
  await expect(dialog(page).getByLabel('Lý do hủy')).toHaveValue('Không thể tiếp tục');
  expect(state.context.course.enrollment.status).toBe('BOOKED');
});

test('TC-UI-GY34-12: đổi thừa tiền yêu cầu chọn hoàn hoặc số dư', async ({ page }) => {
  const state = await openFixture(page, { returnMoney: true });
  await page.getByRole('button', { name: 'Đổi gói', exact: true }).click();
  await dialog(page).getByRole('combobox', { name: 'Gói mới' }).click();
  await page.getByText('Gói mới', { exact: true }).last().click();
  await expect(dialog(page).getByText(/200.000/)).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect(dialog(page).getByText('Chọn cách nhận phần trả lại')).toBeVisible();
  expect(posts(state, '/change')).toHaveLength(0);
  await dialog(page).getByLabel('Ghi vào số dư').check();
  await dialog(page).getByRole('button', { name: 'Xác nhận đổi' }).click();
  await expect.poll(() => posts(state, '/change').length).toBe(1);
  expect(posts(state, '/change')[0].body).toEqual({ planId: 32, settlement: 'CREDIT' });
});

test('TC-UI-GY34-13: số dư thay đổi thì hiện lỗi BE và giữ hóa đơn', async ({ page }) => {
  const state = await openFixture(page, { balance: 720000, creditError: true });
  await page.getByRole('button', { name: /Dùng số dư \(còn/ }).click();
  await dialog(page).getByRole('button', { name: 'Dùng số dư', exact: true }).click();
  await expect(page.getByText('Số dư đã thay đổi, vui lòng tải lại').first()).toBeVisible();
  expect(state.context.invoice.status).toBe('PENDING');
});

test('TC-UI-GY41-04: không gửi khoảng nghỉ ít hơn minDays live', async ({ page }) => {
  const state = await openFixture(page);
  const inputs = page.locator('.ant-picker-range input');
  await inputs.nth(0).fill('21/10/2026');
  await inputs.nth(0).press('Tab');
  await inputs.nth(1).fill('23/10/2026');
  await inputs.nth(1).press('Tab');
  await page.getByRole('button', { name: 'Yêu cầu bảo lưu' }).click();
  await expect(page.getByText('Chọn từ 7 đến 40 ngày')).toBeVisible();
  expect(posts(state, '/freezes')).toHaveLength(0);
});

test('TC-UI-GY41-05: không chọn ngày vượt ngân sách bảo lưu còn lại', async ({ page }) => {
  const state = await openFixture(page);
  const inputs = page.locator('.ant-picker-range input');
  await inputs.nth(0).fill('21/10/2026');
  await inputs.nth(0).press('Tab');
  await inputs.nth(1).fill('31/12/2026');
  await inputs.nth(1).press('Tab');
  await page.getByRole('button', { name: 'Yêu cầu bảo lưu' }).click();
  await expect.poll(() => posts(state, '/freezes').length).toBe(0);
  await expect(page.getByText(/Chọn khoảng bảo lưu|Chọn từ 7 đến 40 ngày/)).toBeVisible();
});
