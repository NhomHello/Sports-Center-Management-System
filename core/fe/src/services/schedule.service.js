import { http } from './http';
/** Danh sách lớp và bộ lọc phía server. */
export const listClasses = (params) => http.get('/classes', { params });
/** Chi tiết lớp và lịch sử thay đổi. */
export const getClass = (id, params) => http.get(`/classes/${id}`, { params });

/** Bộ lọc quản lý theo phạm vi lớp được phép xem. */
export const getClassFilters = () => http.get('/classes/filters');
/** Đăng ký toàn lớp cho chính mình hoặc hội viên đã chọn. */
export const enrollClass = (id, memberId) =>
  memberId
    ? http.post(`/classes/${id}/enrollments`, { memberId })
    : http.post(`/classes/${id}/enrollments/me`);
/** Huỷ theo cùng luật và hạn server trả. */
export const cancelEnrollment = (id, memberId) =>
  http.delete(`/classes/${id}/enrollments/${memberId || 'me'}`);
/** Các đăng ký của hội viên cho nhân viên có quyền. */
export const getMemberEnrollments = (memberId) => http.get(`/members/${memberId}/enrollments`);
/** Danh sách học viên theo phạm vi. */
export const getRoster = (id) => http.get(`/classes/${id}/roster`);
/** Lịch riêng của hội viên, lịch dạy hoặc lịch quản lý. */
export const getSchedule = (kind, params) => {
  const paths = {
    own: '/schedule/me',
    teaching: '/schedule/teaching',
    management: '/schedule/week',
  };
  return http.get(paths[kind], { params });
};
/** Tạo lớp. */
export const createClass = (values) => http.post('/classes', values);
/** Cập nhật toàn bộ cấu hình lớp. */
export const updateClass = (id, values) => http.put(`/classes/${id}`, values);
/** Huỷ lớp, giữ lịch sử. */
export const cancelClass = (id) => http.delete(`/classes/${id}`);
/** HLV có quyền giảng dạy và tài khoản hoạt động. */
export const listCoaches = () => http.get('/classes/coaches');
/** Danh mục có phân trang. */
export const listResources = (resource, params) => http.get(`/${resource}`, { params });
/** Lưu tài nguyên mới hoặc chỉnh sửa. */
export const saveResource = (resource, { id, ...values }) =>
  id ? http.put(`/${resource}/${id}`, values) : http.post(`/${resource}`, values);
/** Ngừng hoạt động tài nguyên. */
export const stopResource = (resource, id) => http.delete(`/${resource}/${id}`);
