import { Layout } from 'antd';
import { Suspense, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { MainHeader } from '@/components/common/MainHeader';
import { PageLoading } from '@/components/common/PageLoading';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { buildMenuItems } from '@/router/buildMenuItems';
import { routeRegistry } from '@/router/routeRegistry';

/** Khung ứng dụng sau đăng nhập; menu luôn được giới hạn theo quyền hiện có. */
export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const menuItems = useMemo(() => buildMenuItems(routeRegistry, can), [can]);
  const navItems = useMemo(() => menuItems.flatMap((item) => item.children ?? [item]), [menuItems]);
  const selectedKey = navItems.find((item) => item.key === location.pathname)?.key;

  return (
    <Layout className="scms-app-shell">
      <MainHeader
        groupedNavItems={menuItems}
        selectedKey={selectedKey}
        user={user}
        onNavigate={navigate}
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
        <span className="scms-app-footer__note">Quản lý trung tâm thể thao</span>
      </Layout.Footer>
    </Layout>
  );
}
