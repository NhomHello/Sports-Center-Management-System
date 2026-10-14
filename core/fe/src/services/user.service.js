import { http } from './http';

const BASE = '/users';

/** @param {{ page?: number, pageSize?: number, search?: string, roleId?: number, status?: string }} params */
export const listUsers = (params) => http.get(BASE, { params });

/** @param {number} id */
export const getUser = (id) => http.get(`${BASE}/${id}`);

/** @param {{ email: string, password: string, fullName: string, phone?: string, roleId: number }} payload */
export const createUser = (payload) => http.post(BASE, payload);

/** @param {number} id @param {number} roleId */
export const updateUserRole = (id, roleId) => http.patch(`${BASE}/${id}/role`, { roleId });

/** @param {number} id @param {string} status */
export const updateUserStatus = (id, status) => http.patch(`${BASE}/${id}/status`, { status });

/** Xác minh email thủ công khi hội viên không nhận được thư. @param {number} id */
export const verifyUserEmail = (id) => http.post(`${BASE}/${id}/email-verification`);
