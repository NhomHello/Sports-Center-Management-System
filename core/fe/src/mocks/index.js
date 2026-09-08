/**
 * MOCK DATA cho FE lam giao dien truoc khi BE co API.
 * Cach dung trong page (tam thoi, xoa khi API san sang):
 *   import { mockRequest, membershipPlans } from '@/mocks';
 *   useQuery({ queryKey: ['mock-plans'], queryFn: () => mockRequest(membershipPlans) });
 * Ket qua co dang giong http.js tra ve: { success, message, data, meta }.
 */
export { membershipPlans, memberships } from './membershipPlans.mock';
export { subjects } from './subjects.mock';
export { rooms } from './rooms.mock';
export { gymClasses, classSchedules } from './classes.mock';
export { invoices, payments } from './invoices.mock';

const DEFAULT_DELAY_MS = 400;

/**
 * Gia lap goi API: tra ve sau delay, kem meta phan trang neu la mang.
 * @param {unknown} data
 * @param {{ delayMs?: number, page?: number, pageSize?: number }} [options]
 */
export const mockRequest = (data, { delayMs = DEFAULT_DELAY_MS, page = 1, pageSize = 10 } = {}) =>
  new Promise((resolve) => {
    setTimeout(() => {
      if (!Array.isArray(data)) return resolve({ success: true, message: 'OK', data });
      const start = (page - 1) * pageSize;
      resolve({
        success: true,
        message: 'OK',
        data: data.slice(start, start + pageSize),
        meta: { page, pageSize, total: data.length, totalPages: Math.ceil(data.length / pageSize) },
      });
    }, delayMs);
  });
