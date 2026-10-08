import { PERMISSIONS } from '@scms/shared';
import { ROUTES } from '@/constants';
import { ENROLLMENT_STATUS, SESSION_STATUS } from '@/constants/schedule';

const SHORTCUT_ORDER = [
  ROUTES.SCHEDULE,
  ROUTES.MEMBERS,
  ROUTES.MEMBERSHIP_PLANS,
  ROUTES.PAYMENTS,
  ROUTES.NOTIFICATIONS,
  ROUTES.PROFILE,
  ROUTES.SYSTEM_USERS,
  ROUTES.SYSTEM_ROLES,
  ROUTES.SYSTEM_SETTINGS,
];
const SHORTCUT_DESCRIPTIONS = Object.freeze({
  [ROUTES.SCHEDULE]: 'Khám phá lớp học, xem lịch và theo dõi các buổi tập.',
  [ROUTES.MEMBERS]: 'Tra cứu hồ sơ và thông tin gói tập của hội viên.',
  [ROUTES.MEMBERSHIP_PLANS]: 'Tìm hiểu thời hạn, quyền lợi và giá của từng gói tập.',
  [ROUTES.PAYMENTS]: 'Xem hóa đơn, trạng thái thanh toán và lịch sử giao dịch.',
  [ROUTES.NOTIFICATIONS]: 'Theo dõi thay đổi lớp học và cập nhật từ trung tâm.',
  [ROUTES.PROFILE]: 'Xem thông tin cá nhân và gói tập của bạn.',
  [ROUTES.SYSTEM_USERS]: 'Tra cứu tài khoản và thông tin truy cập hệ thống.',
  [ROUTES.SYSTEM_ROLES]: 'Xem vai trò và phạm vi quyền trong hệ thống.',
  [ROUTES.SYSTEM_SETTINGS]: 'Xem thông tin trung tâm và các thiết lập vận hành.',
});

const getShortcutRank = (path) => {
  const index = SHORTCUT_ORDER.indexOf(path);
  return index < 0 ? SHORTCUT_ORDER.length : index;
};

/** Dùng cùng registry với điều hướng để quyền thay đổi không làm lối tắt bị lệch. */
export const buildDashboardShortcuts = (routes, can) =>
  routes
    .filter(
      (route) =>
        route.menu &&
        ![ROUTES.DASHBOARD, ROUTES.CHANGE_PASSWORD].includes(route.path) &&
        can(route.permission),
    )
    .map((route) => ({
      path: route.path,
      title: route.menu.label,
      icon: route.menu.icon,
      description: SHORTCUT_DESCRIPTIONS[route.path] || `Mở ${route.menu.label.toLowerCase()}.`,
    }))
    .sort((a, b) => getShortcutRank(a.path) - getShortcutRank(b.path));

/** Chỉ chọn API lịch có quyền tương ứng; quyền xem lớp không cho phép đọc lịch trung tâm. */
export const resolveDashboardSchedule = (can) => {
  if (can(PERMISSIONS.CLASS_READ_ALL)) return 'management';
  if (can(PERMISSIONS.SCHEDULE_VIEW_TEACHING)) return 'teaching';
  if (can(PERMISSIONS.SCHEDULE_VIEW_OWN)) return 'own';
  return null;
};

/** Buổi còn lại của dữ liệu tuần, gồm buổi đang diễn ra và loại đăng ký đã huỷ. */
export const getUpcomingSessions = (events = [], now, kind) =>
  events
    .filter(
      (event) =>
        event.status === SESSION_STATUS.SCHEDULED &&
        new Date(event.endAt) > now &&
        (kind !== 'own' || event.enrollmentStatus === ENROLLMENT_STATUS.BOOKED),
    )
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
