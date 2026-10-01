import { http } from './http';

const BASE = '/members';

/** Lấy hồ sơ của tài khoản đang đăng nhập, gồm trạng thái và gói hiện tại. */
export const getOwnProfile = () => http.get(`${BASE}/me`);

/** @param {{ email?: string, fullName?: string, phone?: string }} payload */
export const updateOwnProfile = (payload) => http.patch(`${BASE}/me`, payload);

/** Danh sách định danh để chọn hội viên nhận hóa đơn tại quầy. */
export const listMembers = (params) => http.get(BASE, { params });
