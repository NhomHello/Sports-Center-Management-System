import { theme as antdTheme } from 'antd';
import { PALETTES } from './palettes';

export const COLORS = Object.freeze({
  NAVY: '#0f172a',
  BLUE: '#2563eb',
  CANVAS: '#f6f8fc',
  SURFACE: '#ffffff',
  BORDER: '#dce3ee',
  TEXT: '#17243b',
  MUTED: '#52627a',
  AMBER: '#d97706',
});
export const RADIUS = Object.freeze({ CARD: 16, CONTROL: 10 });
export const SPACING = Object.freeze({ XS: 4, SM: 8, MD: 16, LG: 24, XL: 32, XXL: 48 });

/** Ant Design và CSS nhận cùng palette, kể cả các popup render qua portal. */
export function createAppTheme(mode) {
  const p = PALETTES[mode] ?? PALETTES.light;
  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: p.action,
      colorInfo: p.blue,
      colorSuccess: p.success,
      colorWarning: p.warning,
      colorError: p.danger,
      colorLink: p.blue,
      colorLinkHover: p.blue,
      colorText: p.text,
      colorTextSecondary: p.muted,
      colorTextTertiary: p.subtle,
      colorTextPlaceholder: p.subtle,
      colorBgLayout: p.canvas,
      colorBgContainer: p.surface,
      colorBgElevated: p.surface,
      colorFillAlter: p['surface-soft'],
      colorBorder: p.border,
      colorBorderSecondary: p['border-soft'],
      borderRadius: RADIUS.CONTROL,
      borderRadiusLG: RADIUS.CARD,
      fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, sans-serif",
      fontSize: 14,
      lineHeight: 1.55,
      controlHeight: 44,
      boxShadowSecondary: p['panel-shadow'],
    },
    components: {
      Layout: { headerBg: p.surface, siderBg: p.surface, bodyBg: p.canvas },
      Menu: {
        colorPrimary: p.blue,
        itemBg: p.surface,
        itemColor: p.muted,
        itemSelectedBg: p['soft-blue'],
        itemSelectedColor: p.blue,
        itemHoverBg: p.hover,
      },
      Card: { borderRadiusLG: RADIUS.CARD, headerFontSize: 16 },
      Button: {
        borderRadius: RADIUS.CONTROL,
        fontWeight: 600,
        colorPrimary: p.action,
        colorPrimaryHover: p['action-hover'],
        colorPrimaryActive: p['action-hover'],
        primaryColor: p['on-accent'],
      },
      Table: { headerBg: p['surface-soft'], headerColor: p.muted, rowHoverBg: p.hover },
      Tabs: {
        itemSelectedColor: p.blue,
        itemHoverColor: p.blue,
        itemActiveColor: p.blue,
        inkBarColor: p.blue,
      },
      Pagination: { colorPrimary: p.blue, colorPrimaryHover: p.blue },
    },
  };
}

/** Giữ tương thích các import theme sáng hiện có. */
export const theme = createAppTheme('light');
