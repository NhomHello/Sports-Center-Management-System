import { describe, expect, it } from 'vitest';
import {
  getWaitlistAction,
  shouldHideEnrollmentReason,
  shouldShowEnrollmentAction,
} from './classBookingPresentation';

const context = (item, overrides = {}) => ({
  item: { seatsRemaining: 0, canEnroll: false, canJoinWaitlist: true, ...item },
  allowed: true,
  booked: false,
  ...overrides,
});

describe('Thao tác đăng ký gọn theo trạng thái server', () => {
  it('lớp đầy chỉ đưa ra thao tác vào danh sách chờ', () => {
    const state = context({});
    expect(getWaitlistAction(state)).toBe('join');
    expect(shouldShowEnrollmentAction(state)).toBe(false);
    expect(shouldHideEnrollmentReason(state)).toBe(true);
  });

  it('lớp còn chỗ giữ nút đăng ký', () => {
    const state = context({ seatsRemaining: 3, canEnroll: true });
    expect(getWaitlistAction(state)).toBeNull();
    expect(shouldShowEnrollmentAction(state)).toBe(true);
  });

  it('đang chờ chỉ cho rời danh sách, giữ nút xác nhận khi server cho phép', () => {
    const waiting = context({ waitlist: { status: 'WAITING' } });
    const offered = context({ canEnroll: true, waitlist: { status: 'OFFERED' } });
    expect(getWaitlistAction(waiting)).toBe('leave');
    expect(shouldShowEnrollmentAction(waiting)).toBe(false);
    expect(getWaitlistAction(offered)).toBe('leave');
    expect(shouldShowEnrollmentAction(offered)).toBe(true);
  });

  it('giữ lối tiếp tục thanh toán cho khóa học đang giữ chỗ', () => {
    const state = context({ enrollment: { status: 'PENDING_PAYMENT' }, price: 1200000 });
    expect(shouldShowEnrollmentAction(state)).toBe(true);
    expect(getWaitlistAction(state)).toBeNull();
  });

  it('giữ nút bị khóa và lý do khi hội viên bị chặn vì điều kiện khác', () => {
    const state = context({ canJoinWaitlist: false, enrollReason: 'Chưa xác minh email' });
    expect(getWaitlistAction(state)).toBeNull();
    expect(shouldShowEnrollmentAction(state)).toBe(true);
    expect(shouldHideEnrollmentReason(state)).toBe(false);
  });

  it('hội viên đang chờ nhưng bị chặn vẫn thấy lý do không thể đăng ký', () => {
    const state = context({
      waitlist: { status: 'WAITING' },
      canJoinWaitlist: false,
      enrollReason: 'Trùng lịch học',
    });
    expect(getWaitlistAction(state)).toBe('leave');
    expect(shouldShowEnrollmentAction(state)).toBe(true);
    expect(shouldHideEnrollmentReason(state)).toBe(false);
  });

  it('không mở luồng chờ chính chủ cho nhân viên đăng ký hộ', () => {
    const state = context({}, { memberId: 7 });
    expect(getWaitlistAction(state)).toBeNull();
    expect(shouldShowEnrollmentAction(state)).toBe(true);
  });

  it.each([{ allowed: false }, { booked: true }])(
    'giữ giới hạn quyền và đăng ký hiện có: %j',
    (overrides) => {
      const state = context({}, overrides);
      expect(getWaitlistAction(state)).toBeNull();
      expect(shouldShowEnrollmentAction(state)).toBe(false);
    },
  );
});
