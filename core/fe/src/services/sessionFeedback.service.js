import { http } from './http';
/** HLV chỉ lấy danh sách buổi phụ trách, server kiểm tra phạm vi. */
export const getSessionFeedback = (id) => http.get(`/classes/sessions/${id}/feedback`);
/** Version dùng để phát hiện bản ghi thay đổi trong lúc form đang mở. */
export const saveSessionFeedback = (id, memberId, data) =>
  http.put(`/classes/sessions/${id}/feedback/${memberId}`, data);
/** Nhật ký nhận xét của người dùng đã đăng nhập. */
export const getOwnSessionFeedback = (params) => http.get('/attendance/feedback/me', { params });
/** Mô tả từng buổi độc lập với giờ học và điểm danh. */
export const updateSessionDescription = (id, description) =>
  http.patch(`/classes/sessions/${id}/description`, { description });
