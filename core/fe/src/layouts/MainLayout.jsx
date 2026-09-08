import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Dropdown, Flex, Layout, Menu, Space, Typography } from 'antd';
import { Suspense, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { PageLoading } from '@/components/common/PageLoading';
import { SIDER_WIDTH } from '@/constants';
import { env } from '@/config/env';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { buildMenuItems } from '@/router/buildMenuItems';
import { routeRegistry } from '@/router/routeRegistry';
import { SPACING } from '@/theme/theme';

const { Header, Sider, Content } = Layout;
const LOGOUT_KEY = 'logout';

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

  const userMenu = {
    items: [{ key: LOGOUT_KEY, icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true }],
    onClick: ({ key }) => key === LOGOUT_KEY && logout(),
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={SIDER_WIDTH}>
        <Typography.Title
          level={5}
          style={{ color: '#fff', textAlign: 'center', margin: SPACING.MD, whiteSpace: 'nowrap' }}
        >
          {collapsed ? 'SC' : env.APP_NAME}
        </Typography.Title>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openKeys}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: `0 ${SPACING.LG}px` }}>
          <Flex justify="flex-end" align="center" style={{ height: '100%' }}>
            <Dropdown menu={userMenu} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.fullName}</span>
                <Typography.Text type="secondary">({user?.role?.name})</Typography.Text>
              </Space>
            </Dropdown>
          </Flex>
        </Header>
        <Content style={{ margin: SPACING.LG }}>
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
}
