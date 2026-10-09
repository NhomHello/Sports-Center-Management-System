import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Flex, Layout, Menu } from 'antd';
import { Suspense, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { PageLoading } from '@/components/common/PageLoading';
import { env } from '@/config/env';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { buildMenuItems } from '@/router/buildMenuItems';
import { routeRegistry } from '@/router/routeRegistry';

const LOGOUT_KEY = 'logout';

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'SH';

function AppSidebar({ collapsed, items, openKeys, selectedKey, user, onNavigate }) {
  return (
    <Layout.Sider
      className="scms-sidebar"
      theme="light"
      width={236}
      collapsedWidth={76}
      collapsed={collapsed}
      trigger={null}
    >
      <div className="scms-sidebar__brand">
        <span className="scms-brand__mark">
          <ThunderboltFilled />
        </span>
        {!collapsed && (
          <span className="scms-brand__copy">
            <strong>{env.APP_NAME}</strong>
            <small>SPORT CENTER</small>
          </span>
        )}
      </div>
      <Menu
        className="scms-sidebar-nav"
        mode="inline"
        items={items}
        selectedKeys={[selectedKey]}
        defaultOpenKeys={openKeys}
        onClick={({ key }) => onNavigate(key)}
      />
      <div className="scms-sidebar__status">
        <span className="scms-sidebar__status-dot" />
        {!collapsed && (
          <span>
            <strong>Hệ thống sẵn sàng</strong>
            <small>{user?.role?.name}</small>
          </span>
        )}
      </div>
    </Layout.Sider>
  );
}

function AppHeader({ collapsed, user, onToggle, onLogout }) {
  const userMenu = {
    items: [{ key: LOGOUT_KEY, icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true }],
    onClick: ({ key }) => key === LOGOUT_KEY && onLogout(),
  };

  return (
    <Layout.Header className="scms-main-header">
      <Flex align="center" gap={14}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          onClick={onToggle}
        />
        <span className="scms-header-context">
          <strong>Không gian quản trị</strong>
          <small>Theo dõi và vận hành trung tâm</small>
        </span>
      </Flex>
      <Dropdown menu={userMenu} trigger={['click']}>
        <button className="scms-account" type="button">
          <Avatar className="scms-account__avatar">{getInitials(user?.fullName)}</Avatar>
          <span className="scms-account__copy">
            <strong>{user?.fullName}</strong>
            <small>{user?.role?.name}</small>
          </span>
        </button>
      </Dropdown>
    </Layout.Header>
  );
}

/** Layout chinh: sidebar (menu theo quyen) + header (user) + noi dung. */
export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const menuItems = useMemo(() => buildMenuItems(routeRegistry, can), [can]);
  const openKeys = useMemo(
    () => menuItems.filter((item) => item.children).map((item) => item.key),
    [menuItems],
  );

  return (
    <Layout className="scms-app-shell">
      <AppSidebar
        collapsed={collapsed}
        items={menuItems}
        openKeys={openKeys}
        selectedKey={location.pathname}
        user={user}
        onNavigate={navigate}
      />
      <Layout className="scms-app-frame">
        <AppHeader
          collapsed={collapsed}
          user={user}
          onToggle={() => setCollapsed((value) => !value)}
          onLogout={logout}
        />
        <Layout.Content className="scms-app-content">
          <main className="scms-app-content__inner">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </main>
        </Layout.Content>
        <Layout.Footer className="scms-app-footer">
          <span>
            <strong>SportHub</strong> · © {new Date().getFullYear()} · Cùng bạn khỏe hơn mỗi ngày
          </span>
          <span>Quản lý trung tâm thể thao</span>
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
