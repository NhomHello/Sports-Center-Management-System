import { describe, expect, it } from 'vitest';
import {
  getApiAvailabilityNotice,
  getApiOperationErrorMessage,
  getMissingApiEndpoint,
  shouldRetryApiQuery,
} from './apiAvailability';

describe('API availability errors', () => {
  it('recognizes an unregistered endpoint and ignores its query string', () => {
    const error = {
      status: 404,
      message: 'Không tìm thấy GET /api/v1/invoices/me?page=1&pageSize=10',
    };

    expect(getMissingApiEndpoint(error)).toBe('GET /api/v1/invoices/me');
    expect(getApiAvailabilityNotice(error, 'Danh sách hóa đơn')).toMatchObject({
      type: 'warning',
      retryable: false,
    });
  });

  it('does not misclassify an ordinary missing record as a missing route', () => {
    expect(getMissingApiEndpoint({ status: 404, message: 'Không tìm thấy hóa đơn' })).toBeNull();
  });

  it('explains an unavailable mutation without hiding API validation errors', () => {
    expect(
      getApiOperationErrorMessage(
        {
          status: 404,
          message: 'Không tìm thấy PATCH /members/me',
        },
        'cập nhật hồ sơ',
      ),
    ).toContain('cập nhật hồ sơ chưa được thực hiện');
    expect(
      getApiOperationErrorMessage({ status: 400, message: 'Email đã tồn tại' }, 'đăng ký'),
    ).toBe('Email đã tồn tại');
  });

  it.each([
    ['network failure', undefined, true],
    ['server failure', 503, true],
    ['missing resource', 404, false],
    ['validation failure', 400, false],
    ['permission failure', 403, false],
  ])('retry policy handles %s correctly', (_case, status, expected) => {
    expect(shouldRetryApiQuery(0, { status })).toBe(expected);
  });
});
