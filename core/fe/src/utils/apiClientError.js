import { ERROR_CODES } from '@scms/shared';

/**
 * Loi tu API sau khi da chuan hoa. Component doc .code de xu ly, .message de hien thi.
 */
export class ApiClientError extends Error {
  /**
   * @param {{ message: string, code?: string, status?: number, details?: unknown }} init
   */
  constructor({ message, code = ERROR_CODES.INTERNAL_ERROR, status, details }) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /**
   * Loi validation tung field (tu BE) -> format cho antd form.setFields
   * @returns {{ name: string, errors: string[] }[]}
   */
  toFormFields() {
    if (!Array.isArray(this.details)) return [];
    return this.details.map(({ field, message }) => ({ name: field, errors: [message] }));
  }
}
