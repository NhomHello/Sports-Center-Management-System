import { http } from './http';
/** Tổng kết được lọc tác giả/quyền ở server trước phân trang. */
export const listSummaries = (params) => http.get('/course-summaries', { params });
/** Đọc chuyên cần và kết quả gợi ý do server tính. */
export const getSummary = (id) => http.get(`/classes/${id}/summary`);
/** Chỉ lưu kết quả, không gửi các cột chuyên cần để tránh thay đổi số liệu gốc. */
export const saveSummaryItem = (classId, itemId, data) =>
  http.put(`/classes/${classId}/summary/items/${itemId}`, data);
/** Công bố snapshot, server kiểm tra đủ kết quả và xác nhận thiếu điểm danh. */
export const publishSummary = (id, data) => http.post(`/classes/${id}/summary/publish`, data);
/** Mở lại chỉ dành cho quyền riêng, bắt buộc ghi lý do. */
export const reopenSummary = (id, data) => http.post(`/classes/${id}/summary/reopen`, data);
/** Chỉ kết quả đã công bố của tài khoản hiện tại. */
export const listOwnResults = (params) => http.get('/me/course-results', { params });
/** PDF tạo từ snapshot đã công bố, kiểm tra ownership ở backend. */
export const downloadCourseResult = (id) =>
  http.get(`/me/course-results/${id}/pdf`, { responseType: 'blob' });

/** Đánh giá chính chủ và cửa sổ thời gian còn được sửa. */
export const getOwnRating = (id) => http.get(`/classes/${id}/ratings/me`);
/** Tạo hoặc sửa đánh giá trong thời hạn do API quyết định. */
export const saveRating = (id, data, updating) =>
  http[updating ? 'put' : 'post'](`/classes/${id}/ratings`, data);
/** Nhận xét đã được API ẩn danh hoặc trả danh tính theo quyền kiểm duyệt. */
export const listCoachRatings = (id, params) => http.get(`/coaches/${id}/ratings`, { params });
/** Ghi quyết định ẩn/hiện, giữ nguyên điểm số. */
export const moderateRating = (id, data) => http.patch(`/course-ratings/${id}/moderation`, data);
/** HLV đã có đánh giá để người có quyền kiểm duyệt lựa chọn. */
export const listRatedCoaches = () => http.get('/course-ratings/coaches');
