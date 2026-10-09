/**
 * ROUTE REGISTRY - noi duy nhat khai bao trang + quyen + menu.
 * Them trang moi = them 1 object o day. Sidebar tu sinh theo quyen cua user (buildMenuItems).
 *  - permission: PERMISSIONS.* (mot hoac mang: co IT NHAT MOT la vao duoc). Khong co => ai dang nhap cung vao.
 *  - menu: bo qua neu trang khong hien tren sidebar (vd: trang chi tiet /classes/:id).
 */
import {
  CalendarOutlined,
  DashboardOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { lazy } from 'react';
import { ROUTES } from '@/constants';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const RolesPage = lazy(() => import('@/pages/system/roles/RolesPage'));
const UsersPage = lazy(() => import('@/pages/system/users/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/system/settings/SettingsPage'));
const SchedulePage = lazy(() => import('@/pages/schedule/SchedulePage'));

const GROUP_SYSTEM = 'Hệ thống';

export const routeRegistry = [
  {
    path: ROUTES.SCHEDULE,
    element: <SchedulePage />,
    permission: [PERMISSIONS.SUBJECT_READ, PERMISSIONS.ROOM_READ],
    menu: { label: 'Lớp học và lịch tập', icon: <CalendarOutlined />, group: 'Lịch tập' },
  },
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardPage />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    menu: { label: 'Tổng quan', icon: <DashboardOutlined /> },
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
  // ---- Flow 1 / 2 / 3: team them route o day, vi du:
  // { path: ROUTES.MEMBERSHIP_PLANS, element: <MembershipPlansPage />, permission: PERMISSIONS.MEMBERSHIP_PLAN_READ,
  //   menu: { label: 'Gói tập', icon: <GiftOutlined />, group: 'Hội viên' } },
];
