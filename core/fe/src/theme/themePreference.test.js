import { describe, expect, it, vi } from 'vitest';
import { PALETTES } from './palettes';
import { createThemePreference, normalizeThemeMode, THEME_STORAGE_KEY } from './themePreference';

function browserFixture(saved = null, dark = false, blocked = false) {
  const storageEvents = new EventTarget();
  const media = new EventTarget();
  media.matches = dark;
  const values = new Map([[THEME_STORAGE_KEY, saved]]);
  const browser = {
    document: { documentElement: { dataset: {}, style: { setProperty: vi.fn() } } },
    localStorage: {
      getItem: () => {
        if (blocked) throw new Error('blocked');
        return values.get(THEME_STORAGE_KEY);
      },
      setItem: (key, value) => {
        if (blocked) throw new Error('blocked');
        values.set(key, value);
      },
    },
    matchMedia: () => media,
    addEventListener: (...args) => storageEvents.addEventListener(...args),
    removeEventListener: (...args) => storageEvents.removeEventListener(...args),
  };
  const system = (next) => {
    media.matches = next;
    media.dispatchEvent(new Event('change'));
  };
  const storage = (key, newValue) => {
    const event = new Event('storage');
    Object.assign(event, { key, newValue });
    storageEvents.dispatchEvent(event);
  };
  return { browser, system, storage, values };
}

describe('Lựa chọn giao diện', () => {
  it.each([null, undefined, '', 'sepia', '{}'])('giá trị %s về chế độ hệ thống', (value) => {
    expect(normalizeThemeMode(value)).toBe('system');
  });
  it.each(['light', 'dark', 'system'])('ghi nhớ %s sau lần khởi tạo mới', (mode) => {
    const f = browserFixture();
    const store = createThemePreference(f.browser);
    store.setMode(mode);
    store.destroy();
    const restored = createThemePreference(f.browser);
    expect(restored.getSnapshot().mode).toBe(mode);
    restored.destroy();
  });
  it('theo thay đổi thiết bị và tôn trọng lựa chọn thủ công', () => {
    const f = browserFixture();
    const store = createThemePreference(f.browser);
    f.system(true);
    expect(store.getSnapshot().resolvedMode).toBe('dark');
    store.setMode('light');
    f.system(false);
    f.system(true);
    expect(store.getSnapshot()).toEqual({ mode: 'light', resolvedMode: 'light' });
    store.setMode('system');
    expect(store.getSnapshot().resolvedMode).toBe('dark');
    store.destroy();
  });
  it('lưu trữ bị chặn vẫn đổi được giao diện và cập nhật palette', () => {
    const f = browserFixture(null, false, true);
    const store = createThemePreference(f.browser);
    expect(() => store.setMode('dark')).not.toThrow();
    expect(store.getSnapshot()).toEqual({ mode: 'dark', resolvedMode: 'dark' });
    expect(f.browser.document.documentElement.dataset.theme).toBe('dark');
    expect(f.browser.document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--scms-canvas',
      PALETTES.dark.canvas,
    );
    store.destroy();
  });
  it('đồng bộ tab, bỏ qua key khác và xử lý khi người dùng xóa lưu trữ', () => {
    const f = browserFixture();
    const store = createThemePreference(f.browser);
    f.storage('unrelated', 'dark');
    expect(store.getSnapshot().mode).toBe('system');
    f.storage(THEME_STORAGE_KEY, 'dark');
    expect(store.getSnapshot().resolvedMode).toBe('dark');
    f.storage(THEME_STORAGE_KEY, 'invalid');
    expect(store.getSnapshot().mode).toBe('system');
    f.storage(null, null);
    expect(store.getSnapshot().mode).toBe('system');
    store.destroy();
  });
  it('gỡ subscriber và listener khi component hoặc HMR được dọn dẹp', () => {
    const f = browserFixture();
    const store = createThemePreference(f.browser);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.setMode('dark');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.setMode('light');
    expect(listener).toHaveBeenCalledTimes(1);
    store.destroy();
    f.system(true);
    f.storage(THEME_STORAGE_KEY, 'dark');
    expect(store.getSnapshot().resolvedMode).toBe('light');
  });
});
