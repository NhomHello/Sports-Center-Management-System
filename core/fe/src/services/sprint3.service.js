import { http } from './http';
/** Thao tác từng buổi và điểm danh, quyền được kiểm tra tại API. */
export const rescheduleSession = (id, data) => http.patch(`/classes/sessions/${id}`, data);
/** Huỷ một buổi với lý do, giữ bản ghi lịch sử. */
export const cancelSession = (id, data) => http.post(`/classes/sessions/${id}/cancellation`, data);
/** Đổi HLV từ ngày chọn cho các buổi tương lai. */
export const changeCoach = (id, data) => http.patch(`/classes/${id}/coach`, data);
/** Roster và điểm danh từng buổi trong phạm vi phụ trách. */
export const getAttendance = (id) => http.get(`/classes/sessions/${id}/attendance`);
/** Ghi lựa chọn điểm danh; server kiểm tra hội viên và hạn sửa. */
export const recordAttendance = (id, entries) =>
  http.put(`/classes/sessions/${id}/attendance`, { entries });
/** Mở lại hạn sửa điểm danh, bắt buộc lý do. */
export const unlockAttendance = (id, reason) =>
  http.post(`/classes/sessions/${id}/attendance-unlock`, { reason });
/** Lịch sử điểm danh của người dùng hiện tại, có bộ lọc và phân trang. */
export const getOwnAttendance = (params) => http.get('/attendance/me', { params });
/** Xem buổi bị ảnh hưởng và phòng thay thế đủ điều kiện. */
export const previewMaintenance = (id, params) =>
  http.get(`/rooms/${id}/maintenance-preview`, { params });
/** Áp dụng toàn bộ kế hoạch chuyển phòng hoặc huỷ buổi. */
export const createMaintenance = (id, data) => http.post(`/rooms/${id}/maintenance`, data);
/** Xem lớp đang dạy và đăng ký tương lai trước khi khoá. */
export const getLockPreview = (id) => http.get(`/users/${id}/lock-preview`);
/** Báo cáo cùng bộ lọc cho tất cả chỉ số. */
export const getReport = (params) => http.get('/reports/dashboard', { params });
/** Tải bản báo cáo do server tạo theo bộ lọc đã áp dụng. */
export const exportReport = (params) =>
  http.get('/reports/export', { params, responseType: 'blob' });
/** Mở phiếu báo đã chuyển tiền cho hoá đơn chính chủ. */
export const createClaim = (id, data) => http.post(`/invoices/${id}/claims`, data);
/** Tạo yêu cầu hoàn, backend cập nhật invoice và ngày gói. */
export const requestRefund = (id, data) => http.post(`/invoices/${id}/refund`, data);
/** Danh sách yêu cầu hoàn để tiếp tục xử lý chuyển trả. */
export const listRefunds = (params) => http.get('/refunds', { params });
/** Xác nhận tiền đã chuyển trả bằng mã tham chiếu ngân hàng. */
export const completeRefund = (id, reference) =>
  http.post(`/refunds/${id}/complete`, { reference });
/** Số phiếu đối soát đang mở, trùng và quá hạn. */
export const getReconciliationSummary = () => http.get('/reconciliations/summary');

/** Chỉ số hội viên theo ngưỡng nhắc gia hạn ở server. */
export const getMemberSummary = () => http.get('/members/summary');

/** Ghi nhận đến trung tâm, backend áp dụng policy tài khoản và gói. */
export const checkIn = (memberId) => http.post('/check-ins', { memberId });
