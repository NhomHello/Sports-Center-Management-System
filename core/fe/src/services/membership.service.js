import { http } from './http';

const BASE = '/memberships';

export const listOwnMemberships = () => http.get(`${BASE}/me`);

/** @param {{ planId: number }} payload */
export const createOwnOrder = (payload) => http.post(`${BASE}/me/orders`, payload);

/** @param {{ page?: number, pageSize?: number, memberId?: number }} params */
export const listMemberships = (params) => http.get(BASE, { params });

/** @param {{ planId: number, memberId: number }} payload */
export const createMemberOrder = (payload) => http.post(`${BASE}/orders`, payload);

/** Gói gần nhất của một hội viên (lễ tân/quản lý, quyền MEMBERSHIP_READ_ALL). */
export const getMemberCurrent = (memberId) => http.get(`${BASE}/member/${memberId}/current`);
