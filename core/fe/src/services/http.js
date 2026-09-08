/**
 * Axios instance dung chung. MOI request API phai di qua day (tu gan token, tu unwrap response).
 * Response thanh cong tra ve body { success, message, data, meta } (khong phai AxiosResponse).
 * Loi tra ve ApiClientError.
 */
import axios from 'axios';
import { env } from '@/config/env';
import { HTTP_STATUS } from '@/constants';
import { useAuthStore } from '@/stores/authStore';
import { ApiClientError } from '@/utils/apiClientError';

export const http = axios.create({
  baseURL: env.API_URL,
  timeout: env.REQUEST_TIMEOUT_MS,
});

http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data;

    // Token het han / khong hop le => dang xuat, router se dua ve trang login
    if (status === HTTP_STATUS.UNAUTHORIZED) useAuthStore.getState().logout();

    return Promise.reject(
      new ApiClientError({
        message: body?.message ?? 'Không thể kết nối máy chủ, vui lòng thử lại',
        code: body?.code,
        status,
        details: body?.details,
      }),
    );
  },
);
