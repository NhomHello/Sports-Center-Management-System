import { ERROR_CODES } from '@scms/shared';
import { StatusCodes } from 'http-status-codes';

/**
 * Loi co kiem soat. Service/controller `throw ApiError.xxx()`, error middleware tu tra response.
 * KHONG throw new Error('...') cho loi nghiep vu.
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} code ma loi trong ERROR_CODES
   * @param {string} message thong bao cho nguoi dung
   * @param {unknown} [details] thong tin them (vd: loi validation tung field)
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  /** @param {string} message @param {unknown} [details] */
  static badRequest(message = 'Dữ liệu không hợp lệ', details) {
    return new ApiError(StatusCodes.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  /** @param {string} message @param {string} [code] */
  static unauthorized(message = 'Vui lòng đăng nhập', code = ERROR_CODES.UNAUTHORIZED) {
    return new ApiError(StatusCodes.UNAUTHORIZED, code, message);
  }

  /** @param {string} message @param {string} [code] */
  static forbidden(
    message = 'Bạn không có quyền thực hiện thao tác này',
    code = ERROR_CODES.FORBIDDEN,
  ) {
    return new ApiError(StatusCodes.FORBIDDEN, code, message);
  }

  /** @param {string} message */
  static notFound(message = 'Không tìm thấy dữ liệu') {
    return new ApiError(StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND, message);
  }

  /** @param {string} message @param {unknown} [details] */
  static conflict(message = 'Dữ liệu đã tồn tại', details) {
    return new ApiError(StatusCodes.CONFLICT, ERROR_CODES.CONFLICT, message, details);
  }

  /**
   * Vi pham business rule (vd: goi het han khong duoc dang ky lop).
   * @param {string} message @param {unknown} [details]
   */
  static businessRule(message, details) {
    return new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      ERROR_CODES.BUSINESS_RULE_VIOLATION,
      message,
      details,
    );
  }
}
