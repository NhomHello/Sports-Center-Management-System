/**
 * Design token antd v6. Khôi/Khải chốt design system rồi sửa Ở ĐÂY, không set màu trong component.
 * Tham khao: https://ant.design/docs/react/customize-theme
 */
export const theme = {
  token: {
    colorPrimary: '#3155ee',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorBgLayout: '#f4f7fb',
    colorText: '#101a30',
    colorTextSecondary: '#718096',
    borderRadius: 10,
    fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
    },
    Button: { controlHeight: 42, borderRadius: 10 },
    Input: { controlHeight: 42 },
    Select: { controlHeight: 42 },
    Tabs: { itemSelectedColor: '#3155ee', inkBarColor: '#3155ee' },
  },
};

/** Khoang cach chuan (px) dung trong style inline khi antd khong co prop tuong ung */
export const SPACING = Object.freeze({
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
});
