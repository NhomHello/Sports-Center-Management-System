import { http } from './http';

const BASE = '/auth';

/** @param {{ email: string, password: string }} payload */
export const login = (payload) => http.post(`${BASE}/login`, payload);

/** @param {{ email: string, password: string, fullName: string, phone?: string }} payload */
export const register = (payload) => http.post(`${BASE}/register`, payload);

/** Thong tin user hien tai + permissions */
export const getMe = () => http.get(`${BASE}/me`);
