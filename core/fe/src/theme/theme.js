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

/**
 * Design token antd v6. 
 * Đã được tinh chỉnh sang phong cách siêu hiện đại (Modern SaaS / iOS style).
 */
export const alternateTheme = {
  token: {
    // Tông màu Indigo hiện đại cực kỳ ấn tượng, sang trọng hơn màu xanh dương mặc định
    colorPrimary: '#4f46e5',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // Bo góc lớn mềm mại chuẩn xu hướng
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    
    // Font chữ
    fontFamily: "'Plus Jakarta Sans', Inter, 'Segoe UI', system-ui, sans-serif",
    fontSize: 14,
    
    // Màu nền tổng thể
    colorBgLayout: '#f8fafc', // Xám nhạt siêu sang
    
    // Đổ bóng (Shadows) mượt mà hơn
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    boxShadowSecondary: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
  },
  components: {
    Layout: {
      headerBg: 'rgba(255, 255, 255, 0.8)',
      headerHeight: 72,
    },
    Card: {
      colorBgContainer: '#ffffff',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      borderRadiusLG: 20,
    },
    Button: {
      controlHeight: 40, // Nút to hơn, dễ bấm hơn
      controlHeightLG: 48,
      fontWeight: 600,
      borderRadius: 10,
    },
    Input: {
      controlHeight: 44, // Ô input to, padding rộng như app mobile
      borderRadius: 10,
      colorBgContainer: '#f1f5f9', // Nền input xám nhạt thay vì trắng bệch
      colorBorder: 'transparent', // Bỏ viền mặc định
      activeShadow: '0 0 0 2px rgba(79, 70, 229, 0.1)',
    },
    InputNumber: {
      controlHeight: 44,
      borderRadius: 10,
      colorBgContainer: '#f1f5f9',
      colorBorder: 'transparent',
    },
    Select: {
      controlHeight: 44,
      borderRadius: 10,
      colorBgContainer: '#f1f5f9',
      colorBorder: 'transparent',
    },
    Modal: {
      borderRadiusLG: 24, // Modal bo tròn sâu
      paddingContentHalf: 32,
      paddingMD: 24,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#64748b',
      borderRadiusLG: 16,
      borderColor: '#e2e8f0',
    }
  },
};

/** Khoang cach chuan (px) dung trong style inline */
export const SPACING = Object.freeze({
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
});
