import { http } from './http';
/** Giá và số buổi do server quyết định, FE chỉ gửi kênh và hội viên. */
export const createCourseOrder = (classId, payload) =>
  http.post(`/classes/${classId}/orders`, payload);
