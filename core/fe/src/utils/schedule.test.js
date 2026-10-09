import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { CLASS_STATUS, SESSION_STATUS } from '@/constants/schedule';
import {
  canCancelSession,
  classFormPayload,
  classFormValues,
  vietnamInput,
  vietnamTimestamp,
} from './schedule';

describe('Biểu mẫu lớp học', () => {
  it('tạo form mới với trạng thái mở và một dòng lịch trống', () => {
    expect(classFormValues(null)).toEqual({
      status: CLASS_STATUS.OPEN,
      weeklySchedule: [{}],
    });
  });

  it('hiển thị và gửi thời điểm theo đúng giờ Việt Nam', () => {
    const localTime = vietnamInput('2026-10-06T11:00:00Z');
    expect(vietnamTimestamp(localTime)).toBe('2026-10-06T18:00:00+07:00');
  });

  it('chuyển dữ liệu DatePicker thành payload API', () => {
    const payload = classFormPayload({
      name: 'Yoga buổi tối',
      description: 'Lớp nhóm',
      subjectId: 1,
      roomId: 2,
      coachId: 3,
      capacity: 15,
      status: CLASS_STATUS.OPEN,
      weeklySchedule: [{ dayOfWeek: 2, startTime: '18:00', endTime: '19:00' }],
      startsOn: dayjs('2026-10-06'),
      endsOn: dayjs('2026-10-27'),
      registrationStartAt: dayjs('2026-10-05T08:00:00'),
      registrationEndAt: dayjs('2026-10-06T17:00:00'),
    });

    expect(payload.startsOn).toBe('2026-10-06');
    expect(payload.endsOn).toBe('2026-10-27');
    expect(payload.registrationStartAt).toBe('2026-10-05T08:00:00+07:00');
    expect(payload.registrationEndAt).toBe('2026-10-06T17:00:00+07:00');
  });
});

describe('Huỷ một buổi học', () => {
  const now = dayjs('2026-10-09T10:00:00+07:00');

  it('cho phép huỷ buổi đang theo lịch và chưa bắt đầu', () => {
    const session = { status: SESSION_STATUS.SCHEDULED, startAt: '2026-10-10T10:00:00+07:00' };
    expect(canCancelSession(session, now)).toBe(true);
  });

  it('không cho huỷ buổi đã qua hoặc đã bị huỷ', () => {
    const past = { status: SESSION_STATUS.SCHEDULED, startAt: '2026-10-08T10:00:00+07:00' };
    const cancelled = {
      status: SESSION_STATUS.CANCELLED,
      startAt: '2026-10-10T10:00:00+07:00',
    };
    expect(canCancelSession(past, now)).toBe(false);
    expect(canCancelSession(cancelled, now)).toBe(false);
  });
});
