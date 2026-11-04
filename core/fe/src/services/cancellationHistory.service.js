import { http } from './http';
/** Chính chủ dùng /me; nhân viên tra cứu theo quyền hoặc hội viên được chọn. */
export const listCancellations = (params, staff = false) =>
  http.get(staff ? '/course-cancellations' : '/course-cancellations/me', { params });
