import { describe, expect, it } from 'vitest';
import { sessionAttendance } from './courseHistory';
const now = '2030-01-01T12:00:00Z';
const session = {
  status: 'COMPLETED',
  startAt: '2030-01-01T11:00:00Z',
  inEnrollmentPeriod: true,
  attendance: null,
};
describe('Nhãn điểm danh trong bảng từng buổi', () => {
  it('TC-COURSE-HISTORY-UI-01: không có bản ghi thì chưa điểm danh, không được tự thành vắng', () => {
    expect(sessionAttendance(session, now).label).toBe('Chưa điểm danh');
    expect(sessionAttendance({ ...session, attendance: { status: 'ABSENT' } }, now).label).toBe(
      'Vắng mặt',
    );
  });
  it('TC-COURSE-HISTORY-UI-02: phân biệt buổi tương lai, buổi đã hủy và ngoài thời gian đăng ký', () => {
    expect(sessionAttendance({ ...session, startAt: '2030-01-02T11:00:00Z' }, now).label).toBe(
      'Chưa đến giờ học',
    );
    expect(sessionAttendance({ ...session, status: 'CANCELLED' }, now).label).toBe('Buổi đã hủy');
    expect(sessionAttendance({ ...session, inEnrollmentPeriod: false }, now).label).toBe(
      'Ngoài thời gian đăng ký',
    );
  });
  it('TC-COURSE-HISTORY-UI-03: đã hủy đăng ký vẫn hiện kết quả lịch sử thực tế, không ghi đè nó bằng nhãn trống', () => {
    expect(
      sessionAttendance(
        { ...session, inEnrollmentPeriod: false, attendance: { status: 'EXCUSED' } },
        now,
      ).label,
    ).toBe('Xin nghỉ');
  });
});
