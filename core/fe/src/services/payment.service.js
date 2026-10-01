import { http } from './http';

/** @param {{ page: number, pageSize: number }} params @param {boolean} own */
export const listInvoices = (params, own = false) =>
  http.get(own ? '/invoices/me' : '/invoices', { params });

/** @param {number} invoiceId */
export const getInvoice = (invoiceId) => http.get(`/invoices/${invoiceId}`);

/** @param {number} invoiceId */
export const collectCash = (invoiceId) => http.post(`/payments/invoices/${invoiceId}/cash`);

/** Tạo hoặc tái sử dụng hóa đơn tại quầy; không gửi giá từ FE. */
export const createCounterInvoice = (payload) => http.post('/memberships/orders', payload);

/** Lựa chọn gói đang bán được lấy từ API theo quyền. */
export const listSellingPlans = () => http.get('/membership-plans');
