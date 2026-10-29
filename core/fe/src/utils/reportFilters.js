const WEEK_DAYS = 7;
const QUARTER_MONTHS = 3;
/** Khoảng nhanh dùng ngày Việt Nam đã được page cung cấp; không theo timezone trình duyệt. */
export const reportPreset = (preset, today) => {
  const ranges = { today: [today, today], week: [today.subtract(WEEK_DAYS - 1, 'day'), today],
    month: [today.startOf('month'), today], quarter: [today.month(Math.floor(today.month() / QUARTER_MONTHS) * QUARTER_MONTHS).startOf('month'), today],
    year: [today.startOf('year'), today] };
  if (!ranges[preset]) return null;
  return { range: ranges[preset], groupBy: preset === 'year' ? 'month' : preset === 'quarter' ? 'week' : 'day' };
};
/** Chỉ submit bộ lọc đầy đủ; compare false không gửi chuỗi/boolean lạ sang API. */
export const reportQuery = ({ range, compare, ...values }) => ({ ...values,
  from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD'),
  ...(compare && { compare: 'previous' }),
});
