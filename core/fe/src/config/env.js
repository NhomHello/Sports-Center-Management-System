/**
 * NOI DUY NHAT doc import.meta.env. Moi noi khac import { env } tu day.
 * Thieu bien bat buoc => app bao loi ngay khi load.
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

/**
 * @param {string} key
 * @returns {string}
 */
const required = (key) => {
  const value = import.meta.env[key];
  if (!value) throw new Error(`Thiếu biến môi trường ${key} (xem core/fe/.env.example)`);
  return value;
};

export const env = Object.freeze({
  API_URL: required('VITE_API_URL'),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'SportHub',
  REQUEST_TIMEOUT_MS: Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS) || DEFAULT_REQUEST_TIMEOUT_MS,
  IS_DEV: import.meta.env.DEV,
});
