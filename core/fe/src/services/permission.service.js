import { http } from './http';

const BASE = '/permissions';

/** Danh sach permission nhom theo module (cho ma tran phan quyen) */
export const listPermissions = () => http.get(BASE);
