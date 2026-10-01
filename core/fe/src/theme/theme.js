/** Màu dùng chung theo bộ nhận diện SportHub. */
export const COLORS = Object.freeze({
  NAVY: '#0f172a',
  BLUE: '#2563eb',
  CANVAS: '#f6f8fc',
  SURFACE: '#ffffff',
  BORDER: '#e4eaf3',
  TEXT: '#17243b',
  MUTED: '#65758d',
  AMBER: '#d97706',
});

export const RADIUS = Object.freeze({ CARD: 24, CONTROL: 14 });

/** Design token antd v6; token giao dien duoc dieu chinh tai day. */
export const theme = {
  token: {
    colorPrimary: COLORS.BLUE,
    colorInfo: COLORS.BLUE,
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 16,
    colorBgLayout: COLORS.CANVAS,
    colorBgContainer: COLORS.SURFACE,
    colorText: COLORS.TEXT,
    colorTextSecondary: COLORS.MUTED,
    fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, sans-serif",
    fontSize: 14,
    lineHeight: 1.55,
    controlHeight: 44,
    boxShadowSecondary: '0 18px 48px -34px rgba(15, 23, 42, 0.36)',
  },
  components: {
    Layout: {
      headerBg: COLORS.SURFACE,
    },
    Card: { borderRadiusLG: RADIUS.CARD, headerFontSize: 16 },
    Button: { borderRadius: 999, fontWeight: 600 },
    Input: { borderRadius: RADIUS.CONTROL },
    Select: { borderRadius: RADIUS.CONTROL },
    Table: { headerBg: '#f8fafc', headerColor: '#526078', rowHoverBg: '#f5f8ff' },
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
