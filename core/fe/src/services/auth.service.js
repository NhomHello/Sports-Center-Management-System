import { http } from './http';

const BASE = '/auth';

/** @param {{ email: string, password: string }} payload - email cũng nhận số điện thoại. */
export const login = (payload) => http.post(`${BASE}/login`, payload);

/** @param {{ email: string, password: string, fullName: string, phone?: string }} payload */
export const register = (payload) => http.post(`${BASE}/register`, payload);

/** @param {{ currentPassword: string, password: string }} payload */
export const changePassword = (payload) => http.post(`${BASE}/password-changes`, payload);

/** Thong tin user hien tai + permissions */
export const getMe = () => http.get(`${BASE}/me`);

/** Gửi lại email xác minh; API luôn trả thành công để không lộ email nào đã đăng ký. */
export const requestEmailVerification = (payload) =>
  http.post(`${BASE}/email-verifications`, payload);

/** @param {{ token: string }} payload token lấy từ link trong email */
export const confirmEmailVerification = (payload) =>
  http.post(`${BASE}/email-verifications/confirm`, payload);
