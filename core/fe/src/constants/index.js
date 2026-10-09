/**
 * Hang so KY THUAT cua frontend. So nghiep vu => lay tu API /settings, KHONG de o day.
 */

export const STORAGE_KEYS = Object.freeze({
  AUTH: 'scms.auth',
});

/** Duong dan route - dung ROUTES.X thay vi go chuoi '/system/roles' */
export const ROUTES = Object.freeze({
  DASHBOARD: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORBIDDEN: '/403',
  SYSTEM_ROLES: '/system/roles',
  SYSTEM_USERS: '/system/users',
  SYSTEM_SETTINGS: '/system/settings',
  SCHEDULE: '/schedule',
});

/** Key cho React Query - moi entity mot key goc de invalidate dong bo */
export const QUERY_KEYS = Object.freeze({
  ME: ['auth', 'me'],
  ROLES: ['roles'],
  PERMISSIONS: ['permissions'],
  USERS: ['users'],
  SETTINGS: ['settings'],
  SCHEDULE: ['schedule'],
});

export const HTTP_STATUS = Object.freeze({
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
});

export const TABLE = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: ['10', '20', '50'],
});

export const DATE_FORMATS = Object.freeze({
  DATE: 'DD/MM/YYYY',
  DATE_TIME: 'DD/MM/YYYY HH:mm',
  TIME: 'HH:mm',
});

export const DEFAULT_CURRENCY = 'VND';
export const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Enum trang thai tai khoan - khop voi enum UserStatus trong schema.prisma */
export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

/** Meta hien thi cho trang thai tai khoan (mau + nhan). */
export const USER_STATUS_META = Object.freeze({
  ACTIVE: { color: 'green', label: 'Hoạt động' },
  INACTIVE: { color: 'red', label: 'Đã khoá' },
});

export const FORM_LAYOUT = Object.freeze({
  LABEL_COL: { span: 24 },
  WRAPPER_COL: { span: 24 },
});

export const SIDER_WIDTH = 240;
