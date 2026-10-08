import { Layout } from 'antd';
import { Suspense, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { MainHeader, MainSidebar } from '@/components/common/MainHeader';
import { PageLoading } from '@/components/common/PageLoading';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { buildMenuItems } from '@/router/buildMenuItems';
import { routeRegistry } from '@/router/routeRegistry';

/** Khung ứng dụng sau đăng nhập theo bố cục sidebar + top bar của Ant Design Pro. */
export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const menuItems = useMemo(() => buildMenuItems(routeRegistry, can), [can]);
  const navItems = useMemo(() => menuItems.flatMap((item) => item.children ?? [item]), [menuItems]);
  const selectedKey = navItems.find((item) => item.key === location.pathname)?.key;

  return (
    <Layout className="scms-app-shell">
      <MainSidebar
        groupedNavItems={menuItems}
        selectedKey={selectedKey}
        user={user}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
      />
      <Layout className="scms-app-frame">
        <MainHeader
          groupedNavItems={menuItems}
          selectedKey={selectedKey}
          user={user}
          onNavigate={navigate}
          onLogout={logout}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
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
            <strong>Sports Center</strong> · © {new Date().getFullYear()} · Cùng bạn khỏe hơn mỗi
            ngày
          </span>
          <span className="scms-app-footer__note">Lớp học · Lịch tập · Kết nối</span>
        </Layout.Footer>
      </Layout>
    </Layout>
  );
}
