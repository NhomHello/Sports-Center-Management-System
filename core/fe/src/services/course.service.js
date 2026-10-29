import { http } from './http';
/** Tổng kết được lọc tác giả/quyền ở server trước phân trang. */
export const listSummaries = (params) => http.get('/course-summaries', { params });
/** Đọc chuyên cần và kết quả gợi ý do server tính. */
export const getSummary = (id) => http.get(`/classes/${id}/summary`);
/** Chỉ lưu kết quả, không gửi các cột chuyên cần để tránh thay đổi số liệu gốc. */
export const saveSummaryItem = (classId, itemId, data) =>
  http.put(`/classes/${classId}/summary/items/${itemId}`, data);
