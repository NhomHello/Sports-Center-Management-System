/**
 * ROUTE REGISTRY - noi duy nhat khai bao trang + quyen + menu.
 * Them trang moi = them 1 object o day. Sidebar tu sinh theo quyen cua user (buildMenuItems).
 *  - permission: PERMISSIONS.* (mot hoac mang: co IT NHAT MOT la vao duoc). Khong co => ai dang nhap cung vao.
 *  - menu: bo qua neu trang khong hien tren sidebar (vd: trang chi tiet /classes/:id).
 */
import {
  AppstoreOutlined,
  CalendarOutlined,
  DashboardOutlined,
  HomeOutlined,
  ScheduleOutlined,
  SafetyOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { lazy } from 'react';
import { Navigate } from 'react-router';
import { ROUTES } from '@/constants';

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const RolesPage = lazy(() => import('@/pages/system/roles/RolesPage'));
const UsersPage = lazy(() => import('@/pages/system/users/UsersPage'));
const SettingsPage = lazy(() => import('@/pages/system/settings/SettingsPage'));
const SchedulePage = lazy(() => import('@/pages/schedule/SchedulePage'));

const GROUP_SYSTEM = 'Hệ thống';
const GROUP_SCHEDULE = 'Lịch tập';

export const routeRegistry = [
  {
    path: ROUTES.DASHBOARD,
    element: <DashboardPage />,
    permission: PERMISSIONS.DASHBOARD_VIEW,
    menu: { label: 'Tổng quan', icon: <DashboardOutlined /> },
  },
  {
    path: ROUTES.SCHEDULE,
    element: <Navigate to={ROUTES.SCHEDULE_OPEN} replace />,
  },
  {
    path: ROUTES.SCHEDULE_OPEN,
    element: <SchedulePage section="open" />,
    permission: PERMISSIONS.CLASS_READ,
    menu: {
      label: 'Lớp đang mở',
      icon: <CalendarOutlined />,
      group: GROUP_SCHEDULE,
    },
  },
  {
    path: ROUTES.SCHEDULE_MANAGEMENT,
    element: <SchedulePage section="classes" />,
    permission: [
      PERMISSIONS.CLASS_CREATE,
      PERMISSIONS.CLASS_UPDATE,
      PERMISSIONS.CLASS_DELETE,
    ],
    menu: {
      label: 'Quản lý lớp',
      icon: <ScheduleOutlined />,
      group: GROUP_SCHEDULE,
    },
  },
  {
    path: ROUTES.SCHEDULE_SUBJECTS,
    element: <SchedulePage section="subjects" />,
    permission: PERMISSIONS.SUBJECT_READ,
    menu: {
      label: 'Bộ môn',
      icon: <AppstoreOutlined />,
      group: GROUP_SCHEDULE,
    },
  },
  {
    path: ROUTES.SCHEDULE_ROOMS,
    element: <SchedulePage section="rooms" />,
    permission: PERMISSIONS.ROOM_READ,
    menu: {
      label: 'Phòng tập',
      icon: <HomeOutlined />,
      group: GROUP_SCHEDULE,
    },
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
