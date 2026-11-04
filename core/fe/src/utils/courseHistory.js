export const COURSE_ENROLLMENT_LABELS = Object.freeze({
  BOOKED: 'Đã đăng ký',
  CANCELLED: 'Đã hủy đăng ký',
  PENDING_PAYMENT: 'Chờ thanh toán lần đăng ký mới',
});
const ATTENDANCE = Object.freeze({
  PRESENT: { color: 'success', label: 'Có mặt' },
  ABSENT: { color: 'error', label: 'Vắng mặt' },
  EXCUSED: { color: 'processing', label: 'Xin nghỉ' },
});
/** Không có bản ghi không đồng nghĩa vắng; phân biệt buổi hủy, ngoài đăng ký và chưa đến giờ. */
export const sessionAttendance = (session, asOf) => {
  if (session.attendance)
    return ATTENDANCE[session.attendance.status] ?? { label: 'Chưa xác định' };
  if (session.status === 'CANCELLED') return { color: 'default', label: 'Buổi đã hủy' };
  if (!session.inEnrollmentPeriod) return { color: 'default', label: 'Ngoài thời gian đăng ký' };
  if (new Date(session.startAt) > new Date(asOf))
    return { color: 'default', label: 'Chưa đến giờ học' };
  return { color: 'warning', label: 'Chưa điểm danh' };
};
