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

export const listPayments = (params, own = false) => http.get(own ? '/payments/me' : '/payments', { params });
export const getCheckout = (invoiceId) => http.post(`/payments/invoices/${invoiceId}/checkout`);
export const simulatePayment = (invoiceId) => http.post(`/payments/invoices/${invoiceId}/dev-simulate`);
export const refundInvoice = (invoiceId, data) => http.post(`/payments/invoices/${invoiceId}/refund`, data);
export const listReconciliation = (params) => http.get('/payments/reconciliation', { params });
export const resolveReconciliation = (id, data) => http.post(`/payments/reconciliation/${id}/resolve`, data);
export const getRevenue = (params) => http.get('/reports/revenue', { params });
export const listAudit = (params) => http.get('/audit-logs', { params });
