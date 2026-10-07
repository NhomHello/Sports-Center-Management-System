import { http } from './http';

const BASE = '/notifications';

/** Lấy danh sách thông báo của tài khoản hiện tại. */
export const listNotifications = (params) => http.get(BASE, { params });

/** @param {number} id */
export const markNotificationRead = (id) => http.patch(`${BASE}/${id}/read`);
