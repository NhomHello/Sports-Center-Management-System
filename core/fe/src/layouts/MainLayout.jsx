import { Layout } from 'antd';
/* Alternate inline-header implementation from FE Khai (superseded by MainHeader).
import { LogoutOutlined, UserOutlined, FireFilled } from '@ant-design/icons';
import { Avatar, Dropdown, Layout, Menu, Space, Typography, theme } from 'antd';
*/
import { Suspense, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { MainHeader } from '@/components/common/MainHeader';
import { PageLoading } from '@/components/common/PageLoading';
import { ROUTES } from '@/constants';
/*
import { env } from '@/config/env';
*/
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { buildMenuItems } from '@/router/buildMenuItems';
import { routeRegistry } from '@/router/routeRegistry';

/** Khung ứng dụng sau đăng nhập; menu luôn được giới hạn theo quyền hiện có. */
/*
const { Header, Content, Footer } = Layout;
const LOGOUT_KEY = 'logout';

Layout chính thay thế đã được hợp nhất vào MainHeader và stylesheet dùng chung.
*/
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
      {/* Alternate inline layout from FE Khai retained in merge history.
  const { token } = theme.useToken();

  const menuItems = useMemo(() => buildMenuItems(routeRegistry, can), [can]);

  const userMenu = {
    items: [{ key: LOGOUT_KEY, icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true }],
    onClick: ({ key }) => key === LOGOUT_KEY && logout(),
  };

  return (
    <Layout 
      style={{ 
        minHeight: '100vh', 
        // Hình nền xám nhạt kết hợp ánh sáng gradient xanh ở góc trên tạo điểm nhấn, bớt sự nhàm chán
        background: 'radial-gradient(circle at 80% -20%, #e6f4ff 0%, #f0f2f5 40%, #f0f2f5 100%)',
        backgroundAttachment: 'fixed'
      }}
    >
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 99,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '0 32px',
          boxShadow: '0 4px 24px -8px rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          height: 64,
        }}
      >
        <div style={{ flex: '0 0 auto', marginRight: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FireFilled style={{ fontSize: 28, color: token.colorPrimary, filter: 'drop-shadow(0 2px 6px rgba(22,119,255,0.4))' }} />
          <Typography.Title
            level={4}
            style={{ margin: 0, fontWeight: 800, color: '#141414', letterSpacing: '-0.5px' }}
          >
            {env.APP_NAME || 'SCMS'}
          </Typography.Title>
        </div>
        
        <Menu
          mode="horizontal"
          items={menuItems}
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ flex: '1 1 auto', borderBottom: 'none', background: 'transparent', lineHeight: '62px', fontSize: 15, fontWeight: 600 }}
        />

        <div style={{ flex: '0 0 auto', marginLeft: 'auto' }}>
          <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 8, transition: 'all 0.3s', background: 'rgba(255, 255, 255, 0.5)' }} className="scms-header-user">
              <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#1677ff', color: '#fff' }} />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600, color: '#262626', fontSize: 13 }}>{user?.fullName}</span>
                <span style={{ fontSize: 11, color: '#8c8c8c' }}>{user?.role?.name || 'Nhân viên'}</span>
              </div>
            </Space>
          </Dropdown>
        </div>
      </Header>
      
      <Content style={{ padding: '40px 32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </Content>
      
      <Footer style={{ textAlign: 'center', color: '#8c8c8c', fontSize: 14, background: 'transparent', marginTop: 'auto', paddingBottom: 24 }}>
        Sports Center Management System ©{new Date().getFullYear()} by NhomHello
      </Footer> */}
    </Layout>
  );
}
