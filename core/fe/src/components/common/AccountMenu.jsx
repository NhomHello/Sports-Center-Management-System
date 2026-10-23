import { useState } from 'react';
import { Avatar, Dropdown } from 'antd';
import {
  BellOutlined,
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { ROUTES } from '@/constants';
import './accountMenu.css';

const ITEMS = [
  { key: ROUTES.PROFILE, icon: <UserOutlined />, label: 'Hồ sơ cá nhân' },
  { key: ROUTES.CHANGE_PASSWORD, icon: <LockOutlined />, label: 'Đổi mật khẩu' },
  { key: ROUTES.NOTIFICATIONS, icon: <BellOutlined />, label: 'Thông báo' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
];

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

/** Thông tin tài khoản đầy đủ trong menu, trigger gọn trên màn hình nhỏ. */
export function AccountMenu({ user, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const name = user?.fullName || 'Tài khoản';
  const role = user?.role?.name || 'Tài khoản cá nhân';
  const handleClick = ({ key }) => {
    setOpen(false);
    if (key === 'logout') onLogout();
    else onNavigate(key);
  };
  return (
    <Dropdown
      menu={{ items: ITEMS, onClick: handleClick }}
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      popupRender={(menu) => (
        <div className="scms-account-menu">
          <div className="scms-account-menu__identity">
            <strong>{name}</strong>
            <span>{user?.email}</span>
            <span className="scms-account-menu__role">{role}</span>
          </div>
          {menu}
        </div>
      )}
    >
      <button
        className="scms-account"
        type="button"
        aria-label={`Mở menu tài khoản: ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar className="scms-account__avatar">
          {getInitials(user?.fullName) || <UserOutlined aria-hidden />}
        </Avatar>
        <span className="scms-account__copy">
          <span className="scms-account__name">{name}</span>
          <span className="scms-account__role">{role}</span>
        </span>
        <DownOutlined className="scms-account__chevron" aria-hidden />
      </button>
    </Dropdown>
  );
}
