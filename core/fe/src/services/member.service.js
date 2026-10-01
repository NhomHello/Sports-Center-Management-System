import { http } from './http';

const BASE = '/members';

/** Lấy hồ sơ của tài khoản đang đăng nhập, gồm trạng thái và gói hiện tại. */
/** @param {{ page?: number, pageSize?: number, search?: string }} params */
export const listMembers = (params) => http.get(BASE, { params });

/** @param {number} id */
export const getMember = (id) => http.get(`${BASE}/${id}`);

export const getOwnProfile = () => http.get(`${BASE}/me`);

/** @param {{ email?: string, fullName?: string, phone?: string }} payload */
export const updateOwnProfile = (payload) => http.patch(`${BASE}/me`, payload);

/** @param {{ email: string, fullName: string, phone: string, password: string }} payload */
export const createMember = (payload) => http.post(BASE, payload);

/** @param {number} id @param {object} payload */
export const updateMember = (id, payload) => http.patch(`${BASE}/${id}`, payload);
