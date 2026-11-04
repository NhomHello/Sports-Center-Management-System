import { http } from './http';
const basePath = (memberId) =>
  memberId ? `/members/${memberId}/course-history` : '/attendance/courses';
/** Danh sách khóa thuộc lịch sử của chính chủ hoặc hội viên đang được nhân viên xem. */
export const listCourseHistory = (params, memberId) => http.get(basePath(memberId), { params });
/** Điểm danh và nhận xét được ghép theo từng buổi trong cùng một khóa. */
export const getCourseHistory = (classId, memberId) => http.get(`${basePath(memberId)}/${classId}`);
