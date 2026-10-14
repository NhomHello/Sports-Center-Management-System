import { describe, expect, it } from 'vitest';
import { PERMISSIONS as P } from '@scms/shared';
import { ROUTES } from '@/constants';
import { hasAnyPermission } from '@/utils/permission';
import {
  buildDashboardShortcuts,
  getUpcomingSessions,
  resolveDashboardSchedule,
} from './dashboardData';

const canWith =
  (...granted) =>
  (required) =>
    hasAnyPermission(granted, required);
describe('Tổng quan đúng phạm vi quyền và dữ liệu thật', () => {
  it('quyền đọc lớp không cho phép dashboard gọi lịch trung tâm', () => {
    expect(resolveDashboardSchedule(canWith(P.CLASS_READ))).toBeNull();
    expect(resolveDashboardSchedule(canWith(P.SCHEDULE_VIEW_OWN))).toBe('own');
  });
  it('quyền quản lý rộng ưu tiên lịch trung tâm; HLV ưu tiên lịch được phân công', () => {
    expect(resolveDashboardSchedule(canWith(P.CLASS_READ_ALL, P.SCHEDULE_VIEW_OWN))).toBe(
      'management',
    );
    expect(resolveDashboardSchedule(canWith(P.SCHEDULE_VIEW_TEACHING, P.SCHEDULE_VIEW_OWN))).toBe(
      'teaching',
    );
  });
  it('lối tắt giữ quyền OR của registry, ưu tiên lịch và không lộ trang quản lý tài khoản', () => {
    const routes = [
      { path: ROUTES.SYSTEM_USERS, permission: P.USER_READ, menu: { label: 'Tài khoản' } },
      { path: ROUTES.PROFILE, menu: { label: 'Hồ sơ cá nhân' } },
      {
        path: ROUTES.PAYMENTS,
        permission: [P.INVOICE_READ_ALL, P.INVOICE_READ_OWN],
        menu: { label: 'Hoá đơn' },
      },
      {
        path: ROUTES.SCHEDULE,
        permission: [P.CLASS_READ_ALL, P.CLASS_READ],
        menu: { label: 'Lớp học và lịch tập' },
      },
    ];
    const links = buildDashboardShortcuts(routes, canWith(P.CLASS_READ, P.INVOICE_READ_OWN));
    expect(links.map((link) => link.path)).toEqual([
      ROUTES.SCHEDULE,
      ROUTES.PAYMENTS,
      ROUTES.PROFILE,
    ]);
  });
  it('lịch cá nhân loại buổi quá khứ và đăng ký huỷ, giữ buổi đang diễn ra và không sửa dữ liệu cache', () => {
    const now = new Date('2026-10-08T12:00:00Z');
    const event = (id, startAt, endAt, enrollmentStatus = 'BOOKED') => ({
      id,
      startAt,
      endAt,
      enrollmentStatus,
      status: 'SCHEDULED',
    });
    const data = [
      event('next', '2026-10-08T14:00:00Z', '2026-10-08T15:00:00Z'),
      event('ongoing', '2026-10-08T11:30:00Z', '2026-10-08T12:30:00Z'),
      event('past', '2026-10-08T10:00:00Z', '2026-10-08T11:00:00Z'),
      event('cancelled', '2026-10-08T14:00:00Z', '2026-10-08T15:00:00Z', 'CANCELLED'),
    ];
    expect(getUpcomingSessions(data, now, 'own').map((item) => item.id)).toEqual([
      'ongoing',
      'next',
    ]);
    expect(data.map((item) => item.id)).toEqual(['next', 'ongoing', 'past', 'cancelled']);
  });
  it('HLV và quản lý xem buổi được phép kể cả không có đăng ký cá nhân, bỏ buổi bị huỷ', () => {
    const event = {
      id: 1,
      startAt: '2026-10-08T14:00:00Z',
      endAt: '2026-10-08T15:00:00Z',
      status: 'SCHEDULED',
      enrollmentStatus: null,
    };
    const now = new Date('2026-10-08T12:00:00Z');
    expect(getUpcomingSessions([event], now, 'teaching')).toEqual([event]);
    expect(getUpcomingSessions([{ ...event, status: 'CANCELLED' }], now, 'management')).toEqual([]);
    expect(getUpcomingSessions(undefined, now, 'own')).toEqual([]);
  });
});
