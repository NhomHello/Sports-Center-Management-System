import { http } from './http';
/** Hồ sơ HLV chính chủ, kèm giới hạn giới thiệu và ảnh. */
export const getOwnCoachProfile = () => http.get('/me/coach-profile');
/** Lưu hồ sơ công khai, tách thông tin đăng nhập. */
export const saveOwnCoachProfile = (data) => http.put('/me/coach-profile', data);
/** Ảnh gửi binary để không bị giới hạn JSON/base64. */
export const uploadCoachAvatar = (file) =>
  http.put('/me/coach-profile/avatar', file, { headers: { 'Content-Type': file.type } });
/** Hồ sơ tập luyện chính chủ hoặc nhân viên có quyền đọc. */
export const getMemberProfile = (id) =>
  http.get(id ? `/members/${id}/profile` : '/me/member-profile');
/** Cập nhật hồ sơ theo phạm vi endpoint. */
export const saveMemberProfile = (id, data) =>
  http.put(id ? `/members/${id}/profile` : '/me/member-profile', data);
/** Danh mục HLV công khai theo bộ môn/từ khoá. */
export const listCoaches = (params) => http.get('/coaches', { params });
/** Chi tiết công khai chỉ có thông tin được đồng ý chia sẻ. */
export const getCoach = (id) => http.get(`/coaches/${id}`);
/** Học viên phụ trách có phân trang, không chứa sức khoẻ trong danh sách. */
export const listAssignedMembers = (params) => http.get('/coach/members', { params });
/** Hồ sơ học viên được server kiểm tra phạm vi trước khi trả. */
export const getAssignedMember = (id) => http.get(`/coach/members/${id}`);
/** Ảnh cần JWT: chuyển Blob thành data URL ở service, không gắn token vào URL ảnh. */
export const getCoachAvatar = async (id) => {
  const blob = await http.get(id ? `/coaches/${id}/avatar` : '/me/coach-profile/avatar', {
    responseType: 'blob',
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/** Chuyên môn công khai của HLV, không phụ thuộc quyền xem lớp. */
export const getCoachSubjects = () => http.get('/coaches/subjects');
