import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from './http';
import { createCourseOrder } from './courseOrder.service';
vi.mock('./http', () => ({ http: { post: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
describe('TC-COURSE-ORDER-UI: đúng học viên và hàng đợi', () => {
  it('TC-COURSE-UI-01: memberId số phải được gửi khi nhân viên đăng ký hộ', () => {
    createCourseOrder(7, 15);
    expect(http.post).toHaveBeenCalledWith('/classes/7/orders', { memberId: 15, joinWaitlistWhenFull: true });
  });
  it('TC-COURSE-UI-02: giữ kênh tại quầy và không gửi giá từ client', () => {
    createCourseOrder(7, { memberId: 15, channel: 'COUNTER' });
    expect(http.post).toHaveBeenCalledWith('/classes/7/orders', { memberId: 15, channel: 'COUNTER', joinWaitlistWhenFull: true });
  });
});
