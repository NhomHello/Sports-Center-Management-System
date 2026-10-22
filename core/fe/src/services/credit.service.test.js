import { beforeEach, expect, it, vi } from 'vitest';
import { http } from './http';
import { applyCredit, getMemberCredit, getOwnCredit } from './credit.service';
vi.mock('./http', () => ({ http: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());

it('TC-UI-GY34-04: số dư chính chủ và hội viên có endpoint riêng', () => {
  const params = { page: 2, pageSize: 10 };
  getOwnCredit(params);
  getMemberCredit(8, params);
  expect(http.get).toHaveBeenNthCalledWith(1, '/me/credit', { params });
  expect(http.get).toHaveBeenNthCalledWith(2, '/members/8/credit', { params });
});
it('TC-UI-GY34-05: trừ số dư không tự tính amount hoặc gửi balance', () => {
  applyCredit(9);
  expect(http.post).toHaveBeenCalledExactlyOnceWith('/invoices/9/apply-credit', {});
});
