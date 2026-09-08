/**
 * PERMISSION REGISTRY - nguồn sự thật duy nhất (single source of truth) của mọi permission.
 *
 * - Permission = "một việc hệ thống cho phép làm", định danh bởi code `<module>.<action>`.
 * - Role (vai trò) = tập hợp permission, LƯU TRONG DB, quản lý qua UI bởi Center Manager.
 * - Code (BE lẫn FE) chỉ được tham chiếu PERMISSIONS.*, KHÔNG BAO GIỜ so sánh tên role.
 * - Thêm tính năng mới => thêm action vào đây => chạy `npm run db:seed` để đồng bộ vào DB.
 */

/** @typedef {{ module: string, label: string, actions: Record<string, string> }} PermissionModule */

/** @type {PermissionModule[]} */
export const PERMISSION_MODULES = [
  // ---------- Hệ thống ----------
  { module: 'dashboard', label: 'Tổng quan', actions: { view: 'Xem trang tổng quan' } },
  {
    module: 'user',
    label: 'Tài khoản',
    actions: {
      read: 'Xem danh sách tài khoản',
      create: 'Tạo tài khoản',
      update: 'Cập nhật tài khoản',
      delete: 'Xoá / khoá tài khoản',
      assign_role: 'Gán vai trò cho tài khoản',
    },
  },
  {
    module: 'role',
    label: 'Vai trò & phân quyền',
    actions: {
      read: 'Xem vai trò',
      create: 'Tạo vai trò',
      update: 'Sửa vai trò & quyền',
      delete: 'Xoá vai trò',
    },
  },
  {
    module: 'setting',
    label: 'Cấu hình hệ thống',
    actions: { read: 'Xem cấu hình', update: 'Sửa cấu hình' },
  },
  { module: 'audit', label: 'Nhật ký thao tác', actions: { read: 'Xem nhật ký' } },

  // ---------- Flow 1: User & Membership ----------
  {
    module: 'member',
    label: 'Hội viên',
    actions: {
      read: 'Xem / tìm kiếm hội viên',
      create: 'Đăng ký hội viên tại quầy',
      update: 'Cập nhật hồ sơ hội viên',
    },
  },
  {
    module: 'membership_plan',
    label: 'Gói tập',
    actions: { read: 'Xem gói tập', create: 'Tạo gói', update: 'Sửa gói', delete: 'Xoá gói' },
  },
  {
    module: 'membership',
    label: 'Đăng ký gói',
    actions: {
      read_own: 'Xem gói của mình',
      purchase: 'Mua / gia hạn gói cho mình',
      manage: 'Đăng ký / gia hạn gói hộ hội viên',
      read_all: 'Xem gói của mọi hội viên',
    },
  },

  // ---------- Flow 2: Class booking & Schedule ----------
  {
    module: 'subject',
    label: 'Bộ môn',
    actions: { read: 'Xem', create: 'Tạo', update: 'Sửa', delete: 'Xoá' },
  },
  {
    module: 'room',
    label: 'Phòng tập',
    actions: { read: 'Xem', create: 'Tạo', update: 'Sửa', delete: 'Xoá' },
  },
  {
    module: 'class',
    label: 'Lớp học',
    actions: {
      read: 'Xem danh sách lớp',
      create: 'Tạo lớp',
      update: 'Sửa lớp / lịch',
      delete: 'Huỷ lớp',
      enroll_self: 'Tự đăng ký lớp',
      cancel_self: 'Tự huỷ đăng ký',
      enroll_for_member: 'Đăng ký / huỷ lớp hộ hội viên',
      view_roster: 'Xem danh sách học viên của lớp',
    },
  },
  {
    module: 'schedule',
    label: 'Lịch',
    actions: { view_own: 'Xem lịch tập cá nhân', view_teaching: 'Xem lịch dạy' },
  },

  // ---------- Flow 3: Payment & Report ----------
  {
    module: 'payment',
    label: 'Thanh toán',
    actions: {
      checkout: 'Thanh toán online (SePay)',
      record_cash: 'Ghi nhận thanh toán tại quầy',
      read_own: 'Xem giao dịch của mình',
      read_all: 'Xem mọi giao dịch',
    },
  },
  {
    module: 'invoice',
    label: 'Hoá đơn',
    actions: {
      read_own: 'Xem hoá đơn của mình',
      read_all: 'Xem mọi hoá đơn',
      export: 'In / xuất PDF',
    },
  },
  { module: 'report', label: 'Báo cáo', actions: { view: 'Xem báo cáo doanh thu & thống kê' } },
];

/**
 * Tạo permission code từ module + action.
 * @param {string} module
 * @param {string} action
 * @returns {string} ví dụ: "role.read"
 */
export const toPermissionCode = (module, action) => `${module}.${action}`;

/**
 * Danh sách phẳng mọi permission (dùng để seed DB và hiển thị ma trận quyền).
 * @returns {{ code: string, module: string, moduleLabel: string, action: string, label: string }[]}
 */
export const listPermissions = () =>
  PERMISSION_MODULES.flatMap(({ module, label: moduleLabel, actions }) =>
    Object.entries(actions).map(([action, label]) => ({
      code: toPermissionCode(module, action),
      module,
      moduleLabel,
      action,
      label,
    })),
  );

/**
 * Hằng số để tham chiếu trong code, tránh magic string.
 * Key: MODULE_ACTION (upper snake). Ví dụ: PERMISSIONS.ROLE_READ === 'role.read'
 * @type {Readonly<Record<string, string>>}
 */
export const PERMISSIONS = Object.freeze(
  Object.fromEntries(
    listPermissions().map(({ code, module, action }) => [
      `${module}_${action}`.toUpperCase(),
      code,
    ]),
  ),
);
