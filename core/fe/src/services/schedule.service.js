import { http } from './http';

/** Lấy danh sách bộ môn hoặc phòng tập có tìm kiếm và phân trang. */
export const listResources = (resource, params) => http.get(`/${resource}`, { params });

/** Tạo mới hoặc cập nhật một bộ môn/phòng tập. */
export const saveResource = (resource, { id, ...values }) =>
  id ? http.put(`/${resource}/${id}`, values) : http.post(`/${resource}`, values);

/** Ngừng hoạt động tài nguyên nhưng vẫn giữ dữ liệu lịch sử. */
export const stopResource = (resource, id) => http.delete(`/${resource}/${id}`);
