import { http } from './http';
/** Báo cáo hội viên dùng cùng query với doanh thu. */
export const getMemberReport = (params) => http.get('/reports/members', { params });
/** File báo cáo được xây dựng ở server từ bộ lọc đã áp dụng. */
export const downloadMemberReport = (params) => http.get('/reports/members/export', { params, responseType: 'blob' });
