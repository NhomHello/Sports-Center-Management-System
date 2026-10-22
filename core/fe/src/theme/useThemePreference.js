import { useSyncExternalStore } from 'react';
import { createThemePreference } from './themePreference';

const preference = createThemePreference(window);
if (import.meta.hot) import.meta.hot.dispose(() => preference.destroy());

/** Lựa chọn giao diện độc lập với phiên đăng nhập và không gửi lên server. */
export function useThemePreference() {
  const state = useSyncExternalStore(preference.subscribe, preference.getSnapshot);
  return { ...state, setMode: preference.setMode };
}
