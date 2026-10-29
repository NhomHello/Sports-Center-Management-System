import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { prisma } from '../../core/be/src/config/db.js';
import {
  createFixture,
  cleanup,
  fillDraft,
  publish,
  signIn,
  newPage,
  openResults,
  viewerToken,
} from './helpers/sprint4-khai.mjs';
let f;
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Nghiệm thu tổng kết trên desktop');
  f = await createFixture();
});
test.afterEach(async () => {
  await cleanup(f);
  f = undefined;
});
const snapshot = (page, info) =>
  page.screenshot({ path: info.outputPath('screen.png'), fullPage: true });

test('TC-S4-KHAI-UI-01: assigned coach saves drafts, different result requires a comment', async ({
  page,
}, info) => {
  await signIn(page, f.coachToken, '/course-summaries');
  await page.getByRole('searchbox', { name: 'Tìm tổng kết' }).fill(f.prefix);
  await page.getByRole('searchbox', { name: 'Tìm tổng kết' }).press('Enter');
  await page.getByRole('button', { name: 'Mở tổng kết' }).click();
  const row = page.locator('.ant-table-row').filter({ hasText: f.member.fullName });
  await expect(row).toContainText('100%');
  await expect(page.getByRole('button', { name: 'Công bố tổng kết', exact: true })).toBeDisabled();
  await row.getByRole('button', { name: 'Nhập kết quả' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Kết quả', { exact: true }).click();
  await page.locator('.ant-select-dropdown:visible').getByText('Chưa đạt', { exact: true }).click();
  await modal.locator('.ant-rate-star').nth(3).click();
  await modal.getByRole('button', { name: 'Lưu nháp', exact: true }).click();
  await expect(modal.getByText('Nhập nhận xét khi chọn khác gợi ý')).toBeVisible();
  await modal.getByLabel('Nhận xét', { exact: true }).fill('Cần thêm thời gian để đạt kỹ thuật');
  await modal.getByLabel('Gợi ý khóa tiếp theo', { exact: true }).fill('Khóa bổ trợ');
  await modal.getByRole('button', { name: 'Lưu nháp', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(row).toContainText('Cần thêm thời gian');
  await row.getByRole('button', { name: 'Nhập kết quả' }).click();
  await expect(page.getByRole('dialog').getByLabel('Nhận xét', { exact: true })).toHaveValue(
    'Cần thêm thời gian để đạt kỹ thuật',
  );
  await snapshot(page, info);
});

test('TC-S4-KHAI-UI-02: publish acknowledgment, member PDF, manager reopens and republishes', async ({
  page,
  browser,
}, info) => {
  await fillDraft(f);
  await signIn(page, f.coachToken, `/classes/${f.item.id}/summary`);
  await page.getByRole('button', { name: 'Công bố tổng kết', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Xác nhận công bố' }).click();
  await expect(modal.getByText('Cần xác nhận cảnh báo chưa điểm danh')).toBeVisible();
  await modal.getByRole('checkbox').check();
  await modal.getByRole('button', { name: 'Xác nhận công bố' }).click();
  await expect(page.getByText('Tổng kết đã công bố và khóa chỉnh sửa.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nhập kết quả' })).toHaveCount(0);
  const member = await newPage(browser, f.memberToken, '/profile');
  const manager = await newPage(browser, f.adminToken, `/classes/${f.item.id}/summary`);
  try {
    await member.getByRole('tab', { name: 'Khóa học đã hoàn thành', exact: true }).click();
    const row = member.locator('.ant-table-row').filter({ hasText: f.item.name });
    await expect(row).toContainText('100%');
    const download = member.waitForEvent('download');
    await row.getByRole('button', { name: 'Tải phiếu PDF' }).click();
    expect((await download).suggestedFilename()).toMatch(/^course-result-.*\.pdf$/u);
    await manager.getByRole('button', { name: 'Mở lại tổng kết', exact: true }).click();
    await manager.getByRole('dialog').getByRole('button', { name: 'Xác nhận mở lại' }).click();
    await expect(manager.getByText('Nhập lý do mở lại')).toBeVisible();
    await manager.getByLabel('Lý do mở lại', { exact: true }).fill('Cần điều chỉnh nhận xét');
    await manager.getByRole('dialog').getByRole('button', { name: 'Xác nhận mở lại' }).click();
    await expect(manager.getByText('Lý do mở lại: Cần điều chỉnh nhận xét')).toBeVisible();
    await member.reload();
    await member.getByRole('tab', { name: 'Khóa học đã hoàn thành', exact: true }).click();
    await expect(member.getByText('Chưa có tổng kết đã công bố.', { exact: false })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Công bố tổng kết', exact: true }).click();
    await page.getByRole('dialog').getByRole('checkbox').check();
    await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận công bố' }).click();
    await expect(page.getByText('Tổng kết đã công bố và khóa chỉnh sửa.')).toBeVisible();
    expect(
      (await prisma.courseSummary.findUnique({ where: { classId: f.item.id } })).revision,
    ).toBe(2);
    await snapshot(manager, info);
  } finally {
    await member.context().close();
    await manager.context().close();
  }
});

test('TC-S4-KHAI-UI-03: member creates and edits one rating, expired rating is read only', async ({
  page,
}, info) => {
  await publish(f);
  await openResults(page, f);
  const row = page.locator('.ant-table-row').filter({ hasText: f.item.name });
  await row.getByRole('button', { name: 'Đánh giá khóa học' }).click();
  const modal = page.getByRole('dialog');
  await modal.locator('.ant-rate').nth(0).locator('.ant-rate-star').nth(4).click();
  await modal.locator('.ant-rate').nth(1).locator('.ant-rate-star').nth(3).click();
  await modal.getByLabel('Nhận xét khóa học', { exact: true }).fill('Rất hữu ích');
  await modal.getByRole('button', { name: 'Lưu đánh giá', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await row.getByRole('button', { name: 'Đánh giá khóa học' }).click();
  await expect(modal.getByLabel('Nhận xét khóa học', { exact: true })).toHaveValue('Rất hữu ích');
  await modal.getByLabel('Nhận xét khóa học', { exact: true }).fill('Đã cập nhật nhận xét');
  await modal.getByRole('button', { name: 'Lưu đánh giá', exact: true }).click();
  await expect(modal).toHaveCount(0);
  expect(
    await prisma.courseRating.count({ where: { classId: f.item.id, memberId: f.member.id } }),
  ).toBe(1);
  await prisma.classSession.updateMany({
    where: { classId: f.item.id },
    data: {
      startAt: new Date(Date.now() - 16 * 86400000),
      endAt: new Date(Date.now() - 15 * 86400000),
    },
  });
  await page.reload();
  await page.getByRole('tab', { name: 'Khóa học đã hoàn thành', exact: true }).click();
  await row.getByRole('button', { name: 'Đánh giá khóa học' }).click();
  await expect(modal.getByText('Đã hết thời hạn đánh giá khóa học')).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Lưu đánh giá', exact: true })).toBeDisabled();
  await snapshot(page, info);
});

test('TC-S4-KHAI-UI-04: moderation requires a reason, coach sees anonymized feedback', async ({
  page,
  browser,
}, info) => {
  await publish(f);
  await f.call(
    'post',
    `/classes/${f.item.id}/ratings`,
    { courseStars: 5, coachStars: 4, comment: 'Nhận xét cần kiểm duyệt' },
    f.memberToken,
  );
  await signIn(page, f.adminToken, '/course-ratings');
  await page.getByRole('combobox', { name: 'HLV được đánh giá' }).click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(f.coach.fullName, { exact: true })
    .click();
  const row = page.locator('.ant-table-row').filter({ hasText: f.member.fullName });
  await expect(row).toContainText('Nhận xét cần kiểm duyệt');
  await row.getByRole('button', { name: 'Ẩn nhận xét' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu quyết định' }).click();
  await expect(page.getByText('Nhập lý do quyết định')).toBeVisible();
  await page.getByLabel('Lý do kiểm duyệt', { exact: true }).fill('Không phù hợp nội quy');
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu quyết định' }).click();
  await expect(row.getByText('Đã ẩn', { exact: true })).toBeVisible();
  const coachPage = await newPage(browser, f.coachToken, '/course-ratings');
  try {
    await expect(coachPage.getByText('Nhận xét đã được ẩn', { exact: true })).toBeVisible();
    await expect(coachPage.locator('.ant-table')).not.toContainText(f.member.fullName);
    await expect(coachPage.getByText('Trung bình HLV: 4', { exact: false })).toBeVisible();
    await snapshot(coachPage, info);
  } finally {
    await coachPage.context().close();
  }
});

test('TC-S4-KHAI-UI-05: course-only report applies filters and exports the same class rows', async ({
  page,
}, info) => {
  const token = await viewerToken(f);
  const requests = [];
  page.on('request', (r) => {
    if (r.url().includes('/reports/')) requests.push(r.url());
  });
  await signIn(page, token, '/reports');
  await expect(page.getByText('Tình trạng tổng kết khóa', { exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Doanh thu', exact: true })).toHaveCount(0);
  await page.getByLabel('Bộ môn', { exact: true }).click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(f.subject.name, { exact: true })
    .click();
  await page.getByLabel('HLV', { exact: true }).click();
  await page
    .locator('.ant-select-dropdown:visible')
    .getByText(f.coach.fullName, { exact: true })
    .click();
  await page.getByRole('button', { name: 'Áp dụng tổng kết' }).click();
  await expect(page.locator('.ant-table-row').filter({ hasText: f.item.name })).toBeVisible();
  await page.getByLabel('HLV', { exact: true }).click();
  await page
    .locator('.ant-select-dropdown:visible .ant-select-item-option')
    .filter({ hasNotText: f.coach.fullName })
    .first()
    .click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất Excel tổng kết' }).click();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(await (await download).path());
  expect(workbook.worksheets[0].rowCount).toBe(2);
  expect(workbook.worksheets[0].getCell('A2').value).toBe(f.item.name);
  expect(
    requests.some((url) => url.includes('dashboard') || url.includes('/reports/members')),
  ).toBe(false);
  expect(requests.find((url) => url.includes('/course-summaries/export'))).toContain(
    `subjectId=${f.subject.id}`,
  );
  expect(requests.find((url) => url.includes('/course-summaries/export'))).toContain(
    `coachId=${f.coach.id}`,
  );
  await snapshot(page, info);
});

test('TC-S4-KHAI-UI-06: another coach cannot open summary and network errors can retry', async ({
  page,
}, info) => {
  await signIn(page, f.coachOtherToken, `/classes/${f.item.id}/summary`);
  await expect(page.getByText('Bạn không có quyền thực hiện thao tác này')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nhập kết quả' })).toHaveCount(0);
  await page.route('**/course-summaries?*', (route) =>
    route.fulfill({
      status: 503,
      json: { success: false, message: 'Tạm thời chưa tải được tổng kết' },
    }),
  );
  await page.goto('/course-summaries');
  await expect(page.getByText('Tạm thời chưa tải được tổng kết')).toBeVisible();
  await page.unroute('**/course-summaries?*');
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(page.getByText('Tạm thời chưa tải được tổng kết')).toHaveCount(0);
  await snapshot(page, info);
});

test('TC-S4-KHAI-UI-07: revenue day week month quarter year comparisons export matching filters', async ({
  page,
}, info) => {
  await signIn(page, f.adminToken, '/reports');
  const cases = [
    ['Tháng này', 'Tuần', 'week', 'csv'],
    ['Tháng này', 'Ngày', 'day', 'xlsx'],
    ['Năm nay', 'Tháng', 'month', 'pdf'],
    ['Năm nay', 'Quý', 'quarter', 'xlsx'],
    ['Năm nay', 'Năm', 'year', 'xlsx'],
  ];
  for (const [preset, label, groupBy, format] of cases) {
    await page.getByRole('combobox', { name: 'Khoảng nhanh', exact: true }).click();
    await page.locator('.ant-select-dropdown:visible').getByText(preset, { exact: true }).click();
    await page.getByRole('combobox', { name: 'Nhóm thời gian', exact: true }).click();
    await page.locator('.ant-select-dropdown:visible').getByText(label, { exact: true }).click();
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
    await expect(page.getByText('So với khoảng liền trước cùng số ngày')).toBeVisible();
    await page.getByRole('combobox', { name: 'Định dạng báo cáo', exact: true }).click();
    await page
      .locator('.ant-select-dropdown:visible')
      .getByText(format.toUpperCase(), { exact: true })
      .click();
    const requested = page.waitForRequest((r) => r.url().includes('/reports/export?'));
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xuất báo cáo', exact: true }).click();
    const url = new URL((await requested).url());
    expect(url.searchParams.get('groupBy')).toBe(groupBy);
    expect(url.searchParams.get('compare')).toBe('previous');
    const file = await downloaded;
    expect(file.suggestedFilename().endsWith(`.${format}`)).toBe(true);
    await file.path();

    await page.bringToFront();
    await expect(page.getByRole('button', { name: 'Xuất báo cáo', exact: true })).not.toHaveClass(
      /ant-btn-loading/,
    );
  }
  await snapshot(page, info);
});
