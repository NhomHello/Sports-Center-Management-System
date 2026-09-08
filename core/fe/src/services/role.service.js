import { http } from './http';

const BASE = '/roles';

export const listRoles = () => http.get(BASE);

/** @param {number} id */
export const getRole = (id) => http.get(`${BASE}/${id}`);

/** @param {{ code: string, name: string, description?: string, permissionCodes: string[] }} payload */
export const createRole = (payload) => http.post(BASE, payload);

/**
 * @param {number} id
 * @param {{ name?: string, description?: string, permissionCodes?: string[] }} payload
 */
export const updateRole = (id, payload) => http.put(`${BASE}/${id}`, payload);

/** @param {number} id */
export const deleteRole = (id) => http.delete(`${BASE}/${id}`);

/** @param {number} id */
export const setDefaultRole = (id) => http.patch(`${BASE}/${id}/default`);
