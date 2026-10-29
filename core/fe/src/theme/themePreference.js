import { PALETTES } from './palettes';

export const THEME_STORAGE_KEY = 'scms-theme-preference';
export const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
export const THEME_MODES = Object.freeze({ LIGHT: 'light', DARK: 'dark', SYSTEM: 'system' });

/** Giá trị cũ hoặc hỏng không được làm ứng dụng ngừng khởi động. */
export const normalizeThemeMode = (value) =>
  Object.values(THEME_MODES).includes(value) ? value : THEME_MODES.SYSTEM;

/** Giữ lựa chọn thủ công khi thiết bị đổi giao diện. */
export const resolveThemeMode = (mode, systemDark) =>
  mode === THEME_MODES.SYSTEM ? (systemDark ? THEME_MODES.DARK : THEME_MODES.LIGHT) : mode;

/** Đọc lưu trữ có thể bị chặn bởi chính sách trình duyệt. */
export function readThemeMode(browser) {
  try {
    return normalizeThemeMode(browser.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return THEME_MODES.SYSTEM;
  }
}

/** Tạo store ngoài React để bootstrap và mọi provider dùng cùng trạng thái. */
export function createThemePreference(browser) {
  const media = browser.matchMedia(SYSTEM_THEME_QUERY);
  const listeners = new Set();
  let snapshot;
  const publish = (mode) => {
    const resolvedMode = resolveThemeMode(mode, media.matches);
    snapshot = { mode, resolvedMode };
    const root = browser.document.documentElement;
    root.dataset.theme = resolvedMode;
    root.style.colorScheme = resolvedMode;
    for (const [key, value] of Object.entries(PALETTES[resolvedMode]))
      root.style.setProperty(`--scms-${key}`, value);
    listeners.forEach((listener) => listener());
  };
  const handleSystem = () => publish(snapshot.mode);
  const handleStorage = (event) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null)
      publish(normalizeThemeMode(event.newValue));
  };
  media.addEventListener('change', handleSystem);
  browser.addEventListener('storage', handleStorage);
  publish(readThemeMode(browser));
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setMode: (value) => {
      const mode = normalizeThemeMode(value);
      try {
        browser.localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch {
        // Vẫn đổi được giao diện trong phiên hiện tại khi lưu trữ bị chặn.
      }
      publish(mode);
    },
    destroy: () => {
      media.removeEventListener('change', handleSystem);
      browser.removeEventListener('storage', handleStorage);
      listeners.clear();
    },
  };
}
