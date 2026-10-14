import { http } from './http';
/** Danh sách phiếu, có phân trang và bộ lọc ở server. */
export const listCases = (params) => http.get('/reconciliations', { params });
/** Chi tiết giao dịch, liên hệ và hoàn tiền. */
export const getCase = (id) => http.get(`/reconciliations/${id}`);
/** Mọi thao tác được server kiểm tra trạng thái và chống ghi trùng. */
export const actOnCase = (id, action, data) => http.post(`/reconciliations/${id}/${action}`, data);
