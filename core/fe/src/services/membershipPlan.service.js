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

/** Danh mục khung giờ cấu hình gói tự tập. */
export const listPlanFrames = () => http.get('/operating-frames');
/** Danh mục loại phòng; form chỉ chọn khu tự tập. */
export const listPlanAreas = () => http.get('/room-types');
/** Kỳ hiện tại và các kỳ đã mua nối tiếp theo hợp đồng GY-20. */
export const getCurrentPlanPeriod = () => http.get('/memberships/me/current');
