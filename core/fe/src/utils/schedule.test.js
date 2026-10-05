import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { vietnamWeekStart, vietnamInput, vietnamTimestamp } from './schedule';
describe('Lịch theo Việt Nam', () => {
  it('UTC Chủ nhật tối đã là thứ Hai ở Việt Nam', () => {
    expect(vietnamWeekStart(dayjs('2026-10-04T18:00:00Z')).format('YYYY-MM-DD')).toBe('2026-10-05');
  });
  it('Chủ nhật Việt Nam vẫn thuộc tuần bắt đầu thứ Hai trước đó', () => {
    expect(vietnamWeekStart(dayjs('2026-10-11T02:00:00Z')).format('YYYY-MM-DD')).toBe('2026-10-05');
  });
  it('giữ đúng wall time trong form khi đổi UTC qua Việt Nam', () => {
    expect(vietnamTimestamp(vietnamInput('2026-10-06T11:00:00Z'))).toBe(
      '2026-10-06T18:00:00+07:00',
    );
  });
});
