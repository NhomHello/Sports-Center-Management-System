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
} from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { lazy } from 'react';
import { ROUTES } from '@/constants';

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
const MembershipPlansPage = lazy(() => import('@/pages/membership/MembershipPlansPage'));
const MembersPage = lazy(() => import('@/pages/members/MembersPage'));

const GROUP_MEMBER = 'Hội viên';

export const routeRegistry = [
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardPage />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    menu: { label: 'Tổng quan', icon: <DashboardOutlined /> },
  },
  {
    path: ROUTES.PROFILE,
    element: <ProfilePage />,
    menu: { label: 'Hồ sơ cá nhân', icon: <UserOutlined />, group: GROUP_ACCOUNT },
  },
  {
    path: ROUTES.CHANGE_PASSWORD,
    element: <ChangePasswordPage />,
    menu: { label: 'Đổi mật khẩu', icon: <LockOutlined />, group: GROUP_ACCOUNT },
  },
  {
    path: ROUTES.NOTIFICATIONS,
    element: <NotificationsPage />,
    menu: { label: 'Thông báo', icon: <BellOutlined />, group: GROUP_ACCOUNT },
  },
  {
    path: ROUTES.PAYMENTS,
    element: <PaymentsPage />,
    permission: [PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_READ_ALL],
    menu: { label: 'Hoá đơn', icon: <CreditCardOutlined />, group: 'Tài chính' },
  },
  {
    path: ROUTES.MEMBERSHIP_PLANS,
    element: <MembershipPlansPage />,
    permission: PERMISSIONS.MEMBERSHIP_PLAN_READ,
    menu: { label: 'Gói tập', icon: <GiftOutlined />, group: GROUP_MEMBER },
  },
  {
    path: ROUTES.MEMBERS,
    element: <MembersPage />,
    permission: PERMISSIONS.MEMBER_READ,
    menu: { label: 'Quản lý hội viên', icon: <TeamOutlined />, group: GROUP_MEMBER },
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
];
