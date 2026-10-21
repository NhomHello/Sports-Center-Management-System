import { http } from './http';

/**
 * GY-22: đăng ký lớp có học phí = mua khóa học. Hội viên tự mua (online, QR); nhân viên gửi
 * memberId để tạo hóa đơn tại quầy. Server giữ chỗ và tính giá theo số buổi còn lại.
 */
export const createCourseOrder = (classId, memberId) =>
  http.post(`/classes/${classId}/orders`, memberId ? { memberId } : {});
