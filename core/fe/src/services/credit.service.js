import { http } from './http';

/** Số dư và sổ biến động chính chủ; phân trang do API thực hiện. */
export const getOwnCredit = (params) => http.get('/me/credit', { params });
/** Nhân viên xem sổ của hội viên theo permission PAYMENT_READ_ALL. */
export const getMemberCredit = (id, params) => http.get(`/members/${id}/credit`, { params });
/** Không tính số tiền khấu trừ ở FE; bỏ amount để backend dùng tối đa hợp lệ. */
export const applyCredit = (id) => http.post(`/invoices/${id}/apply-credit`, {});
