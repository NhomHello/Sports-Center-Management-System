import { HTTP_STATUS } from '@/constants';

const MISSING_ROUTE_PATTERN = /^Không tìm thấy\s+(GET|POST|PUT|PATCH|DELETE)\s+([^\s?]+)/i;
const RETRYABLE_STATUS_MIN = 500;
const MAX_QUERY_RETRIES = 2;

/** Trả về method và path khi backend xác nhận route chưa được đăng ký. */
export const getMissingApiEndpoint = (error) => {
  if (error?.status !== HTTP_STATUS.NOT_FOUND || typeof error.message !== 'string') return null;
  const match = error.message.match(MISSING_ROUTE_PATTERN);
  return match ? `${match[1].toUpperCase()} ${match[2]}` : null;
};

/** Không retry các lỗi 4xx; retry tối đa hai lần với lỗi mạng hoặc máy chủ. */
export const shouldRetryApiQuery = (failureCount, error) =>
  failureCount < MAX_QUERY_RETRIES && (!error?.status || error.status >= RETRYABLE_STATUS_MIN);

/** Tạo thông báo chung cho endpoint chưa có hoặc lỗi tải dữ liệu khác. */
export const getApiAvailabilityNotice = (error, resource) => {
  const endpoint = getMissingApiEndpoint(error);
  if (endpoint) {
    return {
      type: 'warning',
      message: `${resource} chưa khả dụng trên backend hiện tại`,
      description: `Backend chưa đăng ký ${endpoint}. Dữ liệu chưa được tải; cần triển khai API này để sử dụng chức năng.`,
      retryable: false,
    };
  }

  return {
    type: 'error',
    message: error?.message || `Không thể tải ${resource.toLowerCase()}.`,
    description: undefined,
    retryable: shouldRetryApiQuery(0, error),
  };
};

/** Thông báo mutation rõ ràng khi route chưa có; các lỗi nghiệp vụ giữ nguyên từ API. */
export const getApiOperationErrorMessage = (error, operation) => {
  const endpoint = getMissingApiEndpoint(error);
  return endpoint
    ? `Backend chưa cung cấp ${endpoint}; ${operation} chưa được thực hiện.`
    : error?.message || `Không thể ${operation}.`;
};
