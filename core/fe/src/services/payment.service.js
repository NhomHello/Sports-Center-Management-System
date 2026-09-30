import { http } from './http';

export const listInvoices = (params, own = false) => http.get(own ? '/invoices/me' : '/invoices', { params });
export const listPayments = (params, own = false) => http.get(own ? '/payments/me' : '/payments', { params });
export const getCheckout = (invoiceId) => http.post(`/payments/invoices/${invoiceId}/checkout`);
export const simulatePayment = (invoiceId) => http.post(`/payments/invoices/${invoiceId}/dev-simulate`);
export const collectCash = (invoiceId) => http.post(`/payments/invoices/${invoiceId}/cash`);
export const refundInvoice = (invoiceId, data) => http.post(`/payments/invoices/${invoiceId}/refund`, data);
export const listReconciliation = (params) => http.get('/payments/reconciliation', { params });
export const resolveReconciliation = (id, data) => http.post(`/payments/reconciliation/${id}/resolve`, data);
export const getRevenue = (params) => http.get('/reports/revenue', { params });
export const listAudit = (params) => http.get('/audit-logs', { params });
