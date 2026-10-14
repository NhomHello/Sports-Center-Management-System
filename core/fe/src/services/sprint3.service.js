import { http } from './http';
/** Thao tác từng buổi và điểm danh, quyền được kiểm tra tại API. */
export const rescheduleSession = (id, data) => http.patch(`/classes/sessions/${id}`, data);
export const cancelSession = (id, data) => http.post(`/classes/sessions/${id}/cancellation`, data);
export const changeCoach = (id, data) => http.patch(`/classes/${id}/coach`, data);
export const getAttendance = (id) => http.get(`/classes/sessions/${id}/attendance`);
export const recordAttendance = (id, entries) =>
  http.put(`/classes/sessions/${id}/attendance`, { entries });
export const unlockAttendance = (id, reason) =>
  http.post(`/classes/sessions/${id}/attendance-unlock`, { reason });
export const getOwnAttendance = (params) => http.get('/attendance/me', { params });
export const previewMaintenance = (id, params) =>
  http.get(`/rooms/${id}/maintenance-preview`, { params });
export const createMaintenance = (id, data) => http.post(`/rooms/${id}/maintenance`, data);
export const getLockPreview = (id) => http.get(`/users/${id}/lock-preview`);
export const getReport = (params) => http.get('/reports/dashboard', { params });
export const exportReport = (params) =>
  http.get('/reports/export', { params, responseType: 'blob' });
export const createClaim = (id, data) => http.post(`/invoices/${id}/claims`, data);
export const requestRefund = (id, data) => http.post(`/invoices/${id}/refund`, data);
export const listRefunds = (params) => http.get('/refunds', { params });
export const completeRefund = (id, reference) =>
  http.post(`/refunds/${id}/complete`, { reference });
export const getReconciliationSummary = () => http.get('/reconciliations/summary');

/** Chỉ số hội viên theo ngưỡng nhắc gia hạn ở server. */
export const getMemberSummary = () => http.get('/members/summary');
