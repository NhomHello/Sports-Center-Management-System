import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { reportPreset, reportQuery } from './reportFilters';
describe('Bộ lọc báo cáo', () => {
  it('TC-S4-FILTER-01: quý và năm chọn nhóm đủ lớn, không tự đổi bộ lọc đã áp dụng', () => {
    const today = dayjs('2026-10-29');
    const quarter = reportPreset('quarter', today);
    expect(quarter.range[0].format('YYYY-MM-DD')).toBe('2026-10-01');
    expect(quarter.groupBy).toBe('week');
    expect(reportPreset('year', today).groupBy).toBe('month');
    expect(reportPreset('week', today).range[0].format('YYYY-MM-DD')).toBe('2026-10-23');
  });
  it('TC-S4-FILTER-02: compare tắt không gửi boolean sang API', () => {
    const values = { range: [dayjs('2026-10-01'), dayjs('2026-10-29')], compare: false, groupBy: 'month' };
    expect(reportQuery(values)).toEqual({ from: '2026-10-01', to: '2026-10-29', groupBy: 'month' });
    expect(reportQuery({ ...values, compare: true }).compare).toBe('previous');
  });
});
