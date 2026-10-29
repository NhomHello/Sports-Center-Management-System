import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AttendanceSession, AttendanceStatus } from './AttendanceHistoryTable';

describe('Lịch sử điểm danh', () => {
  it.each([
    ['PRESENT', 'Có mặt'],
    ['ABSENT', 'Vắng mặt'],
    ['EXCUSED', 'Xin nghỉ'],
    ['NEW_STATUS', 'Chưa xác định'],
  ])('trạng thái %s giữ đúng ý nghĩa', (status, label) => {
    const html = renderToStaticMarkup(<AttendanceStatus status={status} />);
    expect(html).toContain(label);
    if (status !== 'ABSENT') expect(html).not.toContain('Vắng mặt');
  });
  it('hiển thị ngày Việt Nam khi timestamp UTC rơi vào ngày trước đó', () => {
    const html = renderToStaticMarkup(
      <AttendanceSession
        session={{ startAt: '2026-10-21T23:00:00Z', endAt: '2026-10-22T00:00:00Z' }}
      />,
    );
    expect(html).toContain('22/10/2026');
    expect(html).toContain('06:00 – 07:00');
    expect(html.match(/22\/10\/2026/g)).toHaveLength(1);
  });
  it('dữ liệu thiếu không hiển thị Invalid Date', () => {
    const html = renderToStaticMarkup(<AttendanceSession />);
    expect(html).toContain('Chưa cập nhật');
    expect(html).not.toContain('Invalid Date');
  });
});
