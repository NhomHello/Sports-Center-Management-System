import { describe, expect, it } from 'vitest';
import { cancellationPolicy } from './class-booking-policy.service.js';
const now = new Date('2026-10-06T00:00:00Z');
const enrollment = { status: 'BOOKED' };
const session = (value) => ({ status: 'SCHEDULED', startAt: new Date(value) });
describe('BR-2.5: hạn huỷ do server đánh giá', () => {
  it('cho phép đúng N giờ, từ chối khi thiếu một millisecond', () => {
    const input = { enrollment, hours: 12, sessions: [session('2026-10-06T12:00:00Z')] };
    expect(cancellationPolicy(input, now).canCancel).toBe(true);
    expect(cancellationPolicy(input, new Date(now.getTime() + 1)).canCancel).toBe(false);
  });
  it('ngoại lệ đổi lịch chỉ trước buổi xung đột, không tại/sau mốc đó', () => {
    const input = {
      enrollment,
      hours: 12,
      sessions: [session('2026-10-06T01:00:00Z')],
      exceptionUntil: new Date('2026-10-06T01:00:00Z'),
    };
    expect(cancellationPolicy(input, now).canCancel).toBe(true);
    expect(cancellationPolicy(input, input.exceptionUntil).canCancel).toBe(false);
  });
  it('không huỷ booking không tồn tại/đã huỷ hoặc lớp hết buổi', () => {
    expect(cancellationPolicy({ enrollment: null, hours: 12, sessions: [] }, now).canCancel).toBe(
      false,
    );
    expect(
      cancellationPolicy(
        {
          enrollment: { status: 'CANCELLED' },
          hours: 0,
          sessions: [session('2026-10-06T12:00:00Z')],
        },
        now,
      ).canCancel,
    ).toBe(false);
  });
});
