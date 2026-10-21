import { http } from './http';

const resources = Object.freeze({ membership: 'memberships', enrollment: 'enrollments' });
const purchasePath = (kind, id) => {
  if (!resources[kind]) throw new TypeError('Loại giao dịch không hợp lệ');
  return `/${resources[kind]}/${id}`;
};

/** GY-31: báo nghỉ, không hủy đăng ký khóa hoặc phát sinh tiền. */
export const excuseSession = (id, memberId) =>
  http.post(`/classes/sessions/${id}/excuse`, memberId ? { memberId } : {});
/** GY-34: mọi số tiền được lấy từ preview của backend. */
export const previewCancellation = (kind, id) =>
  http.get(`${purchasePath(kind, id)}/cancel-preview`);
/** Hủy kỳ gói hoặc khóa học theo phương thức hội viên chọn. */
export const cancelPurchase = (kind, id, data) =>
  http.post(`${purchasePath(kind, id)}/cancel`, data);
/** Preview phải gắn đúng đối tượng và đích đổi hiện tại. */
export const previewChange = (kind, id, targetId) =>
  http.get(`${purchasePath(kind, id)}/change-preview`, {
    params: kind === 'membership' ? { planId: targetId } : { classId: targetId },
  });
/** Thu đủ khoản chênh lệch mới chuyển quyền; FE không tự đổi trạng thái. */
export const changePurchase = (kind, id, data) =>
  http.post(`${purchasePath(kind, id)}/change`, data);
/** Lấy chi tiết kỳ gói cùng lịch sử và ngân sách bảo lưu. */
export const getPurchaseMembership = (id) => http.get(`/memberships/${id}`);
