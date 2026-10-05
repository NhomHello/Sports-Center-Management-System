import { http } from './http';
/** Danh sách lớp và bộ lọc phía server. */
export const listClasses = (params) => http.get('/classes', { params });
/** Chi tiết lớp và lịch sử thay đổi. */
export const getClass = (id) => http.get(`/classes/${id}`);
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
