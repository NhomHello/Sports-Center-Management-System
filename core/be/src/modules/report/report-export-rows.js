const MONEY = true;
/** Mọi phần so sánh/cơ cấu được đưa vào file như trên màn hình. */
export const revenueSummaryRows = (report) => [
  ['Khoảng ngày', `${report.filters.from} – ${report.filters.to}`],
  ['Múi giờ', report.timeZone],
  ['Nhóm thời gian', report.filters.groupBy],
  ...comparisonRows(report),
  ...breakdownRows(report),
  ['Gói lọc', report.filters.planId ?? 'Tất cả'],
  ['Hội viên lọc', report.filters.memberId ?? 'Tất cả'],
  ['Doanh thu', report.revenue, MONEY],
  ['Hoàn tiền', report.refunded, MONEY],
  ['Thực thu', report.net, MONEY],
  ['Số giao dịch', report.payment.count],
  ['Tiền thực nhận', report.payment.receivedAmount, MONEY],
  ['Gói tập trong kỳ', report.membership.total],
  ['Gói đang hoạt động', report.membership.active],
  ['Gói đã hết hạn', report.membership.expired],
  ['Số lớp', report.classes.total],
  ['Số buổi', report.classes.sessions],
  ['Buổi huỷ', report.classes.cancelledSessions],
  ['Đăng ký', report.classes.enrollments],
];


function comparisonRows(report) {
  if (!report.comparison) return [];
  return [['Thu kỳ trước', report.comparison.previous.revenue], ['Hoàn kỳ trước', report.comparison.previous.refunded],
    ['Thuần kỳ trước', report.comparison.previous.net], ...Object.entries(report.comparison.percent).map(([key, value]) => [`% thay đổi ${key}`, value ?? '—'])];
}
function breakdownRows(report) {
  return Object.entries(report.breakdown ?? {}).flatMap(([dimension, rows]) => rows.flatMap((row) => [
    [`${dimension}: ${row.label} · thu`, row.revenue], [`${dimension}: ${row.label} · hoàn`, row.refunded], [`${dimension}: ${row.label} · thuần`, row.net],
  ]));
}
