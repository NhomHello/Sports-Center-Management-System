import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { vietnamWeekStart, vietnamInput, vietnamTimestamp, vietnamCalendarDate } from './schedule';
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
  it.each(['Asia/Tokyo', 'Pacific/Auckland'])(
    'ngày thứ Hai được chọn ở %s vẫn truy vấn tuần thứ Hai Việt Nam',
    (browserTimezone) => {
      const selected = dayjs.tz('2026-10-12', browserTimezone);
      const calendarDate = vietnamCalendarDate(selected);
      expect(calendarDate.format('YYYY-MM-DD')).toBe('2026-10-12');
      expect(calendarDate.toISOString()).toBe('2026-10-11T17:00:00.000Z');
      expect(vietnamWeekStart(calendarDate).format('YYYY-MM-DD')).toBe('2026-10-12');
    },
  );
  it('chuyển ngày và tuần giữ wall-date Việt Nam khi đi qua biên tuần', () => {
    const sunday = vietnamCalendarDate(dayjs.tz('2026-10-11', 'Pacific/Auckland'));
    const monday = vietnamCalendarDate(sunday.add(1, 'day'));
    const nextWeek = vietnamCalendarDate(monday.add(7, 'day'));
    expect(monday.format('YYYY-MM-DD')).toBe('2026-10-12');
    expect(vietnamWeekStart(monday).format('YYYY-MM-DD')).toBe('2026-10-12');
    expect(nextWeek.format('YYYY-MM-DD')).toBe('2026-10-19');
    expect(vietnamWeekStart(nextWeek).format('YYYY-MM-DD')).toBe('2026-10-19');
  });
});
