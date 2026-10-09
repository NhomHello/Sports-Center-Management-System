import { http } from './http';

/** Lấy danh sách lớp theo phạm vi và bộ lọc phía server. */
export const listClasses = (params) => http.get('/classes', { params });

/** Lấy các huấn luyện viên đang hoạt động để cấu hình lớp. */
export const listCoaches = () => http.get('/classes/coaches');

/** Tạo lớp và lịch học tuần. */
export const createClass = (values) => http.post('/classes', values);

/** Cập nhật thông tin lớp và các buổi chưa diễn ra. */
export const updateClass = (id, values) => http.put(`/classes/${id}`, values);

/** Lấy danh sách bộ môn hoặc phòng tập có tìm kiếm và phân trang. */
export const listResources = (resource, params) => http.get(`/${resource}`, { params });

/** Tạo mới hoặc cập nhật một bộ môn/phòng tập. */
export const saveResource = (resource, { id, ...values }) =>
  id ? http.put(`/${resource}/${id}`, values) : http.post(`/${resource}`, values);

/** Ngừng hoạt động tài nguyên nhưng vẫn giữ dữ liệu lịch sử. */
export const stopResource = (resource, id) => http.delete(`/${resource}/${id}`);
