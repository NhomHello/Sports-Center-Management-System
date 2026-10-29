/**
 * ROUTE REGISTRY - noi duy nhat khai bao trang + quyen + menu.
 * Them trang moi = them 1 object o day. Sidebar tu sinh theo quyen cua user (buildMenuItems).
 *  - permission: PERMISSIONS.* (mot hoac mang: co IT NHAT MOT la vao duoc). Khong co => ai dang nhap cung vao.
 *  - menu: bo qua neu trang khong hien tren sidebar (vd: trang chi tiet /classes/:id).
 */
import {
  CreditCardOutlined,
  DashboardOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  LockOutlined,
  BellOutlined,
  GiftOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { lazy } from 'react';
import { ROUTES } from '@/constants';

const CourseRatingsPage = lazy(() => import('@/pages/courses/CourseRatingsPage'));
const CourseSummariesPage = lazy(() => import('@/pages/courses/CourseSummariesPage'));
const CourseSummaryPage = lazy(() => import('@/pages/courses/CourseSummaryPage'));
const ReconciliationPage = lazy(() => import('@/pages/reconciliation/ReconciliationPage'));
const AuditPage = lazy(() => import('@/pages/system/audit/AuditPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const RolesPage = lazy(() => import('@/pages/system/roles/RolesPage'));
const UsersPage = lazy(() => import('@/pages/system/users/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/system/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/member/ProfilePage'));
const ChangePasswordPage = lazy(() => import('@/pages/member/ChangePasswordPage'));
const NotificationsPage = lazy(() => import('@/pages/member/NotificationsPage'));
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'));

const GROUP_SYSTEM = 'Hệ thống';
const GROUP_ACCOUNT = 'Tài khoản cá nhân';
const GROUP_FINANCE = 'Tài chính';
const GROUP_SCHEDULE = 'Lịch tập';
const MembershipPlansPage = lazy(() => import('@/pages/membership/MembershipPlansPage'));
const MembersPage = lazy(() => import('@/pages/members/MembersPage'));
const SchedulePage = lazy(() => import('@/pages/schedule/SchedulePage'));

const GROUP_MEMBER = 'Hội viên & gói tập';

const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const AttendanceHistoryPage = lazy(() => import('@/pages/member/AttendanceHistoryPage'));
// Thứ tự mảng = thứ tự menu: việc hằng ngày trước, quản trị và tài khoản cá nhân sau cùng.
const CoachesPage = lazy(() => import('@/pages/profiles/CoachesPage'));
const CoachDetailPage = lazy(() => import('@/pages/profiles/CoachDetailPage'));
const StudentsPage = lazy(() => import('@/pages/profiles/StudentsPage'));
export const routeRegistry = [
  {
    path: ROUTES.COURSE_RATINGS,
    element: <CourseRatingsPage />,
    permission: [PERMISSIONS.COURSE_SUMMARY_MANAGE_ASSIGNED, PERMISSIONS.COURSE_RATING_MODERATE],
    menu: { label: 'Đánh giá khóa học', icon: <SafetyOutlined />, group: GROUP_SCHEDULE },
  },
  {
    path: ROUTES.COURSE_SUMMARIES,
    element: <CourseSummariesPage />,
    permission: [PERMISSIONS.COURSE_SUMMARY_MANAGE_ASSIGNED, PERMISSIONS.COURSE_SUMMARY_VIEW_ALL],
    menu: { label: 'Tổng kết khóa học', icon: <CalendarOutlined />, group: GROUP_SCHEDULE },
  },
  {
    path: ROUTES.COURSE_SUMMARY,
    element: <CourseSummaryPage />,
    permission: [PERMISSIONS.COURSE_SUMMARY_MANAGE_ASSIGNED, PERMISSIONS.COURSE_SUMMARY_VIEW_ALL],
  },
  {
    path: ROUTES.COACHES,
    element: <CoachesPage />,
    permission: PERMISSIONS.COACH_PROFILE_READ,
    menu: { label: 'Huấn luyện viên', icon: <TeamOutlined />, group: GROUP_SCHEDULE },
  },
  {
    path: ROUTES.COACH_DETAIL,
    element: <CoachDetailPage />,
    permission: PERMISSIONS.COACH_PROFILE_READ,
  },
  {
    path: ROUTES.COACH_MEMBERS,
    element: <StudentsPage />,
    permission: PERMISSIONS.MEMBER_PROFILE_VIEW_ASSIGNED,
    menu: { label: 'Học viên của tôi', icon: <TeamOutlined />, group: GROUP_SCHEDULE },
  },
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardPage />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    menu: { label: 'Tổng quan', icon: <DashboardOutlined /> },
  },
  {
    path: ROUTES.SCHEDULE,
    element: <SchedulePage />,
    permission: [
      PERMISSIONS.CLASS_READ,
      PERMISSIONS.CLASS_READ_ALL,
      PERMISSIONS.SCHEDULE_VIEW_OWN,
      PERMISSIONS.SCHEDULE_VIEW_TEACHING,
    ],
    menu: { label: 'Lớp học và lịch tập', icon: <CalendarOutlined />, group: GROUP_SCHEDULE },
  },
  {
    path: ROUTES.ATTENDANCE,
    element: <AttendanceHistoryPage />,
    permission: PERMISSIONS.SCHEDULE_VIEW_OWN,
    menu: { label: 'Lịch sử điểm danh', icon: <CalendarOutlined />, group: GROUP_SCHEDULE },
  },
  {
    path: ROUTES.MEMBERS,
    element: <MembersPage />,
    permission: PERMISSIONS.MEMBER_READ,
    menu: { label: 'Quản lý hội viên', icon: <TeamOutlined />, group: GROUP_MEMBER },
  },
  {
    path: ROUTES.MEMBERSHIP_PLANS,
    element: <MembershipPlansPage />,
    permission: PERMISSIONS.MEMBERSHIP_PLAN_READ,
    menu: { label: 'Gói tập', icon: <GiftOutlined />, group: GROUP_MEMBER },
  },
  {
    path: ROUTES.PAYMENTS,
    element: <PaymentsPage />,
    permission: [PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_READ_ALL],
    menu: { label: 'Hóa đơn', icon: <CreditCardOutlined />, group: GROUP_FINANCE },
  },
  {
    path: ROUTES.RECONCILIATION,
    element: <ReconciliationPage />,
    permission: PERMISSIONS.PAYMENT_RECONCILE,
    menu: { label: 'Hàng chờ đối soát', icon: <CreditCardOutlined />, group: GROUP_FINANCE },
  },
  {
    path: ROUTES.REPORTS,
    element: <ReportsPage />,
    permission: [PERMISSIONS.REPORT_VIEW, PERMISSIONS.COURSE_SUMMARY_VIEW_ALL],
    menu: { label: 'Báo cáo', icon: <DashboardOutlined />, group: GROUP_FINANCE },
  },
  {
    path: ROUTES.SYSTEM_USERS,
    element: <UsersPage />,
    permission: PERMISSIONS.USER_READ,
    menu: { label: 'Tài khoản', icon: <TeamOutlined />, group: GROUP_SYSTEM },
  },
  {
    path: ROUTES.SYSTEM_ROLES,
    element: <RolesPage />,
    permission: PERMISSIONS.ROLE_READ,
    menu: { label: 'Vai trò & quyền', icon: <SafetyOutlined />, group: GROUP_SYSTEM },
  },
  {
    path: ROUTES.SYSTEM_SETTINGS,
    element: <SettingsPage />,
    permission: PERMISSIONS.SETTING_READ,
    menu: { label: 'Cấu hình', icon: <SettingOutlined />, group: GROUP_SYSTEM },
  },
  {
    path: ROUTES.SYSTEM_AUDIT,
    element: <AuditPage />,
    permission: PERMISSIONS.AUDIT_READ,
    menu: { label: 'Nhật ký thao tác', icon: <SafetyOutlined />, group: GROUP_SYSTEM },
  },
  {
    path: ROUTES.PROFILE,
    element: <ProfilePage />,
    menu: { label: 'Hồ sơ cá nhân', icon: <UserOutlined />, group: GROUP_ACCOUNT },
  },
  {
    path: ROUTES.NOTIFICATIONS,
    element: <NotificationsPage />,
    menu: { label: 'Thông báo', icon: <BellOutlined />, group: GROUP_ACCOUNT },
  },
  {
    path: ROUTES.CHANGE_PASSWORD,
    element: <ChangePasswordPage />,
    menu: { label: 'Đổi mật khẩu', icon: <LockOutlined />, group: GROUP_ACCOUNT },
  },
];
