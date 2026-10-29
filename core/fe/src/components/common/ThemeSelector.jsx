import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { THEME_MODES } from '@/theme/themePreference';
import { useThemePreference } from '@/theme/useThemePreference';

const OPTIONS = [
  { key: THEME_MODES.LIGHT, label: 'Sáng', icon: <SunOutlined aria-hidden /> },
  { key: THEME_MODES.DARK, label: 'Tối', icon: <MoonOutlined aria-hidden /> },
  { key: THEME_MODES.SYSTEM, label: 'Theo hệ thống', icon: <DesktopOutlined aria-hidden /> },
];

/** Nút gọn dùng chung ở trang xác thực và thanh công cụ sau đăng nhập. */
export function ThemeSelector() {
  const { mode, setMode } = useThemePreference();
  const [open, setOpen] = useState(false);
  const items = useMemo(
    () =>
      OPTIONS.map((item) => ({
        ...item,
        role: 'menuitemradio',
        'aria-checked': item.key === mode,
      })),
    [mode],
  );
  const selected = OPTIONS.find((item) => item.key === mode);
  const handleMenuClick = useCallback(
    ({ key }) => {
      setMode(key);
      setOpen(false);
    },
    [setMode],
  );
  const menu = useMemo(
    () => ({
      items,
      selectable: true,
      selectedKeys: [mode],
      onClick: handleMenuClick,
    }),
    [handleMenuClick, items, mode],
  );
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      transitionName=""
      open={open}
      onOpenChange={(next, info) => {
        if (info.source === 'trigger') setOpen(next);
      }}
      menu={menu}
    >
      <Button
        className="scms-theme-selector"
        icon={selected.icon}
        aria-label={`Giao diện: ${selected.label}`}
        title={`Giao diện: ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
      />
    </Dropdown>
  );
}
