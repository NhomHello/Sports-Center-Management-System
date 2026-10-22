import {
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { Button, Drawer, Flex, Layout, Menu, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { ReconciliationBadge } from './ReconciliationBadge';
import { NotificationBell } from '@/components/common/NotificationBell';
import { env } from '@/config/env';
import { ROUTES } from '@/constants';
import { AccountMenu } from './AccountMenu';
import { ThemeSelector } from './ThemeSelector';

const getCurrentArea = (items, selectedKey) =>
  items.flatMap((item) => item.children || [item]).find((item) => item.key === selectedKey)
    ?.label || env.APP_NAME;

function Brand() {
  return (
    <Link className="scms-brand" to={ROUTES.DASHBOARD} aria-label={`${env.APP_NAME} - trang chủ`}>
      <span className="scms-brand__mark">
        <ThunderboltFilled />
      </span>
      <span>
        <Typography.Text className="scms-brand__name">{env.APP_NAME}</Typography.Text>
        <Typography.Text className="scms-brand__caption">SPORTS CENTER</Typography.Text>
      </span>
    </Link>
  );
}

function SidebarToggle({ collapsed, onToggle }) {
  const label = collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên';
  return (
    <Tooltip title={label}>
      <Button
        className="scms-sidebar-toggle"
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        aria-label={label}
        aria-expanded={!collapsed}
        onClick={onToggle}
      />
    </Tooltip>
  );
}

/** Thanh điều hướng dọc desktop theo cấu trúc ứng dụng Ant Design Pro. */
export function MainSidebar({ groupedNavItems, selectedKey, user, onNavigate, collapsed }) {
  const activeGroup = groupedNavItems.find((item) =>
    item.children?.some((child) => child.key === selectedKey),
  )?.key;
  return (
    <Layout.Sider
      className="scms-sidebar"
      theme="light"
      width={248}
      collapsedWidth={80}
      collapsed={collapsed}
      trigger={null}
    >
      <div className="scms-sidebar__brand">
        <Brand />
      </div>
      <Menu
        className="scms-sidebar-nav"
        mode="inline"
        items={groupedNavItems}
        selectedKeys={selectedKey ? [selectedKey] : []}
        key={selectedKey}
        defaultOpenKeys={activeGroup ? [activeGroup] : []}
        onClick={({ key }) => onNavigate(key)}
      />
      <div className="scms-sidebar__status">
        <span className="scms-sidebar__status-dot" />
        <span>
          <strong>Tài khoản đang sử dụng</strong>
          <small>{user?.role?.name || `Tài khoản ${env.APP_NAME}`}</small>
        </span>
      </div>
    </Layout.Sider>
  );
}

/** Top bar gọn nhẹ; điều hướng mobile nằm trong Drawer và dùng chung danh sách quyền. */
export function MainHeader({
  groupedNavItems,
  selectedKey,
  user,
  onNavigate,
  onLogout,
  sidebarCollapsed,
  onToggleSidebar,
}) {
  const activeGroup = groupedNavItems.find((item) =>
    item.children?.some((child) => child.key === selectedKey),
  )?.key;
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const handleMobileNavigate = ({ key }) => {
    onNavigate(key);
    setIsNavigationOpen(false);
  };

  return (
    <Layout.Header className="scms-main-header">
      <div className="scms-main-header__inner">
        <Flex align="center" gap={12}>
          <SidebarToggle collapsed={sidebarCollapsed} onToggle={onToggleSidebar} />
          <Button
            className="scms-mobile-nav"
            icon={<MenuOutlined />}
            aria-label="Mở điều hướng"
            aria-expanded={isNavigationOpen}
            onClick={() => setIsNavigationOpen(true)}
          />
          <div className="scms-header-context">
            <Typography.Text strong>{getCurrentArea(groupedNavItems, selectedKey)}</Typography.Text>
            <Typography.Text type="secondary">
              {groupedNavItems.find((i) => i.key === activeGroup)?.label}
            </Typography.Text>
          </div>
        </Flex>
        <Flex className="scms-header-actions" align="center" gap={8}>
          <ReconciliationBadge />
          <ThemeSelector />
          <NotificationBell />
          <AccountMenu user={user} onNavigate={onNavigate} onLogout={onLogout} />
        </Flex>
      </div>
      <Drawer
        className="scms-nav-drawer"
        title={<Brand />}
        placement="left"
        size="min(360px, 92vw)"
        open={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      >
        <Menu
          mode="inline"
          items={groupedNavItems}
          selectedKeys={selectedKey ? [selectedKey] : []}
          key={selectedKey}
          defaultOpenKeys={activeGroup ? [activeGroup] : []}
          onClick={handleMobileNavigate}
        />
      </Drawer>
    </Layout.Header>
  );
}
