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

const getErrorMessage = (body, status) => {
  if (body?.message) return body.message;
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS)
    return 'Bạn đã thử quá nhiều lần. Vui lòng chờ một lúc rồi thử lại.';
  return 'Không thể kết nối máy chủ, vui lòng thử lại';
};

const getErrorCode = (body, status) => {
  if (body?.code) return body.code;
  return status === HTTP_STATUS.TOO_MANY_REQUESTS ? 'RATE_LIMITED' : undefined;
};

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
        message: getErrorMessage(body, status),
        code: getErrorCode(body, status),
        status,
        details: body?.details,
      }),
    );
  },
);
