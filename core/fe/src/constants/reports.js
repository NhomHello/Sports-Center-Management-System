export const REPORT_GROUPS = Object.freeze([
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
]);
export const REPORT_PRESETS = Object.freeze([
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: '7 ngày qua' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'year', label: 'Năm nay' },
  { value: 'custom', label: 'Tuỳ chọn' },
]);
export const REPORT_CHART = Object.freeze({
  groupWidth: 78,
  height: 250,
  top: 18,
  bottom: 44,
  barWidth: 16,
  padding: 8,
  minWidth: 460,
});
export const REPORT_DIMENSIONS = Object.freeze([
  { value: 'byKind', label: 'Loại doanh thu' },
  { value: 'byChannel', label: 'Kênh thanh toán' },
  { value: 'byPlan', label: 'Top gói tự tập' },
  { value: 'byClass', label: 'Top lớp' },
  { value: 'bySubject', label: 'Bộ môn' },
]);
