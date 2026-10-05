import { http } from './http';

const BASE = '/membership-plans';

/** @param {{ page?: number, pageSize?: number, search?: string, isActive?: boolean }} params */
export const listMembershipPlans = (params) => http.get(BASE, { params });

/** @param {number} id */
export const getMembershipPlan = (id) => http.get(`${BASE}/${id}`);

/** @param {object} payload */
export const createMembershipPlan = (payload) => http.post(BASE, payload);

/** @param {number} id @param {object} payload */
export const updateMembershipPlan = (id, payload) => http.put(`${BASE}/${id}`, payload);

/** @param {number} id */
export const deleteMembershipPlan = (id) => http.delete(`${BASE}/${id}`);
