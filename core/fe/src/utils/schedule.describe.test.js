import { describe, expect, it } from 'vitest';
import { describeWeeklySchedule } from './schedule';

describe('describeWeeklySchedule', () => {
  it('gộp các thứ cùng khung giờ và sắp từ Thứ Hai đến Chủ nhật', () => {
    const slots = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '10:00' },
      { dayOfWeek: 3, startTime: '18:00', endTime: '19:00' },
      { dayOfWeek: 1, startTime: '18:00', endTime: '19:00' },
    ];
    expect(describeWeeklySchedule(slots)).toEqual([
      'Thứ Hai, Thứ Tư · 18:00–19:00',
      'Chủ nhật · 09:00–10:00',
    ]);
  });

  it('một lớp học nhiều khung giờ trong cùng ngày giữ thành từng dòng', () => {
    const slots = [
      { dayOfWeek: 2, startTime: '17:00', endTime: '18:00' },
      { dayOfWeek: 2, startTime: '19:00', endTime: '20:00' },
    ];
    expect(describeWeeklySchedule(slots)).toEqual(['Thứ Ba · 17:00–18:00', 'Thứ Ba · 19:00–20:00']);
  });

  it('không có lịch thì trả mảng rỗng', () => {
    expect(describeWeeklySchedule()).toEqual([]);
  });
});
