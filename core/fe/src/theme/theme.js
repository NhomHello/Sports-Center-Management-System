/**
 * Design token antd v6. Khôi/Khải chốt design system rồi sửa Ở ĐÂY, không set màu trong component.
 * Tham khao: https://ant.design/docs/react/customize-theme
 */
export const theme = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 6,
    fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: '#001529',
      headerBg: '#ffffff',
    },
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
