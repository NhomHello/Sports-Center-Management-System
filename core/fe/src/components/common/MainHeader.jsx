import {
  LogoutOutlined,
  MenuOutlined,
  ThunderboltFilled,
  UserOutlined,
  LockOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Dropdown, Flex, Layout, Menu, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { NotificationBell } from '@/components/common/NotificationBell';
import { env } from '@/config/env';
import { ROUTES } from '@/constants';

const LOGOUT_KEY = 'logout';

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase() || 'SH';

/** Thanh điều hướng ngang, chỉ nhận các route đã được lọc theo quyền. */
export function MainHeader({ groupedNavItems, selectedKey, user, onNavigate, onLogout }) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const profileMenu = {
    items: [
      { key: ROUTES.PROFILE, icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
      { key: ROUTES.CHANGE_PASSWORD, icon: <LockOutlined />, label: 'Đổi mật khẩu' },
      { key: ROUTES.NOTIFICATIONS, icon: <BellOutlined />, label: 'Thông báo' },
      { type: 'divider' },
      { key: LOGOUT_KEY, icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
    ],
    onClick: ({ key }) => (key === LOGOUT_KEY ? onLogout() : onNavigate(key)),
  };
  const handleMobileNavigate = ({ key }) => {
    onNavigate(key);
    setIsNavigationOpen(false);
  };

  return (
    <Layout.Header className="scms-main-header">
      <div className="scms-main-header__inner">
        <Link
          className="scms-brand"
          to={ROUTES.DASHBOARD}
          aria-label={`${env.APP_NAME} - trang chủ`}
        >
          <span className="scms-brand__mark">
            <ThunderboltFilled />
          </span>
          <Typography.Text className="scms-brand__name">{env.APP_NAME}</Typography.Text>
        </Link>
        <nav className="scms-desktop-nav" aria-label="Điều hướng chính">
          <Menu
            className="scms-main-nav"
            mode="horizontal"
            items={groupedNavItems}
            selectedKeys={selectedKey ? [selectedKey] : []}
            onClick={({ key }) => onNavigate(key)}
          />
        </nav>
        <Flex className="scms-header-actions" align="center" gap={8}>
          <Button
            className="scms-mobile-nav"
            icon={<MenuOutlined />}
            aria-label="Mở điều hướng"
            aria-expanded={isNavigationOpen}
            onClick={() => setIsNavigationOpen(true)}
          />
          <NotificationBell />
          <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
            <button className="scms-account" type="button" aria-label="Mở menu tài khoản">
              <span className="scms-account__copy">
                <span className="scms-account__name">{user?.fullName || 'Tài khoản'}</span>
                <span className="scms-account__role">{user?.role?.name}</span>
              </span>
              <Avatar className="scms-account__avatar" icon={<UserOutlined />}>
                {getInitials(user?.fullName)}
              </Avatar>
            </button>
          </Dropdown>
        </Flex>
      </div>
      <Drawer
        className="scms-nav-drawer"
        title="Điều hướng SportHub"
        placement="right"
        width="min(360px, 92vw)"
        open={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      >
        <Menu
          mode="inline"
          items={groupedNavItems}
          selectedKeys={selectedKey ? [selectedKey] : []}
          defaultOpenKeys={groupedNavItems.filter((item) => item.children).map((item) => item.key)}
          onClick={handleMobileNavigate}
        />
      </Drawer>
    </Layout.Header>
  );
}
