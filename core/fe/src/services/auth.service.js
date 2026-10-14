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

/** Quên mật khẩu; API luôn trả thành công để không lộ email nào đã đăng ký. */
export const requestPasswordReset = (payload) => http.post(`${BASE}/password-resets`, payload);

/** @param {{ token: string, password: string }} payload */
export const confirmPasswordReset = (payload) =>
  http.post(`${BASE}/password-resets/confirm`, payload);

/** Kênh liên hệ công khai (Zalo/Facebook/điện thoại) để nhờ nhân viên hỗ trợ xác minh thủ công. */
export const getSupportContacts = () => http.get(`${BASE}/support-contacts`);

/** Kiểm tra link trước khi hiện form mật khẩu. */
export const validatePasswordReset = (token) =>
  http.post('/auth/password-resets/validate', { token });
