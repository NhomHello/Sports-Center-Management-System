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
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PROFILE: '/profile',
  CHANGE_PASSWORD: '/change-password',
  NOTIFICATIONS: '/notifications',
  FORBIDDEN: '/403',
  SYSTEM_AUDIT: '/system/audit',
  SYSTEM_ROLES: '/system/roles',
  SYSTEM_USERS: '/system/users',
  SYSTEM_SETTINGS: '/system/settings',
  RECONCILIATION: '/reconciliation',
  PAYMENTS: '/payments',
  MEMBERSHIP_PLANS: '/membership-plans',
  MEMBERS: '/members',
  SCHEDULE: '/schedule',
  REPORTS: '/reports',
  ATTENDANCE: '/attendance',
});

/** Key cho React Query - moi entity mot key goc de invalidate dong bo */
export const QUERY_KEYS = Object.freeze({
  ME: ['auth', 'me'],
  ROLES: ['roles'],
  PERMISSIONS: ['permissions'],
  USERS: ['users'],
  SETTINGS: ['settings'],
  MEMBERS: ['members'],
  NOTIFICATIONS: ['notifications'],
  INVOICES: ['invoices'],
  MEMBERSHIP_PLANS: ['membership-plans'],
  SCHEDULE: ['schedule'],
});

export const HTTP_STATUS = Object.freeze({
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
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

export const VALIDATION = Object.freeze({
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 72,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PHONE_PATTERN: /^(0|\+84)\d{9}$/,
});

export const INVOICE_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

export const INVOICE_CHANNEL = Object.freeze({ ONLINE: 'ONLINE', COUNTER: 'COUNTER' });

/** So ms trong mot ngay, dung tinh han goi (khop TIME.MS_PER_DAY o BE). */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Nhãn hiển thị cho PaymentProvider (khop enum trong schema.prisma). */
export const PAYMENT_PROVIDER_LABELS = Object.freeze({
  COUNTER: 'Tiền mặt tại quầy',
  SEPAY: 'Chuyển khoản (SePay)',
  MANUAL: 'Ghi nhận thủ công',
  SIMULATOR: 'Giả lập',
});

export const INVOICE_CHANNEL_LABELS = Object.freeze({
  COUNTER: 'Tại quầy',
  ONLINE: 'Trực tuyến',
});

export const NOTIFICATION_READ_STATUS = Object.freeze({ READ: 'READ', UNREAD: 'UNREAD' });

export const NOTIFICATION_KIND_LABELS = Object.freeze({
  MEMBERSHIP_EXPIRY_REMINDER: 'Nhắc hạn gói tập',
  MEMBERSHIP_EXPIRED: 'Gói tập hết hạn',
  MEMBERSHIP_FROZEN: 'Bảo lưu gói tập',
  WAITLIST_OFFER: 'Có chỗ trống cho bạn',
  ACCOUNT_LOCKED: 'Tài khoản bị khóa',
  BOOKING_BLOCKED: 'Tạm chặn đăng ký lớp',
  CLASS_CHANGED: 'Thay đổi lớp học',
  CLASS_CANCELLED: 'Lớp/buổi học bị hủy',
  TRAINING_PLAN_PUBLISHED: 'Giáo án mới',
  TRAINING_RESULT_CREATED: 'Kết quả tập luyện',
  PAYMENT_CONFIRMED: 'Thanh toán thành công',
  PAYMENT_TOPUP_REQUIRED: 'Cần chuyển bù',
  PAYMENT_REVIEW_ALERT: 'Cảnh báo thanh toán',
  PAYMENT_REFUND: 'Hoàn tiền',
  PAYMENT_CLAIM_REJECTED: 'Chưa xác nhận chuyển khoản',
  INVOICE_EXPIRED: 'Hóa đơn hết hạn',
});

export const INVOICE_STATUS_META = Object.freeze({
  PENDING: { color: 'gold', label: 'Chờ thanh toán' },
  PAID: { color: 'green', label: 'Đã thanh toán' },
  // FAILED = quá hạn chờ tiền hoặc bị hủy sau hoàn tiền; "Thất bại" khiến hội viên tưởng lỗi hệ thống.
  FAILED: { color: 'default', label: 'Đã hủy (quá hạn)' },
  REFUNDED: { color: 'default', label: 'Đã hoàn tiền' },
});

/** Enum trang thai tai khoan - khop voi enum UserStatus trong schema.prisma */
export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

/** Meta hien thi cho trang thai tai khoan (mau + nhan). */
export const USER_STATUS_META = Object.freeze({
  ACTIVE: { color: 'green', label: 'Hoạt động' },
  INACTIVE: { color: 'red', label: 'Đã khóa' },
});

export const MEMBERSHIP_STATUS_META = Object.freeze({
  ACTIVE: { color: 'green', label: 'Đang hoạt động' },
  PENDING: { color: 'orange', label: 'Chờ xử lý' },
  EXPIRED: { color: 'red', label: 'Hết hạn' },
  CANCELLED: { color: 'default', label: 'Đã hủy' },
});

export const FORM_LAYOUT = Object.freeze({
  LABEL_COL: { span: 24 },
  WRAPPER_COL: { span: 24 },
});

export const SIDER_WIDTH = 240;
