import { describe, expect, it } from 'vitest';
import { classCapacity } from './classCapacity';

describe('Sĩ số đăng ký và giữ chỗ', () => {
  it('minh họa lớp hết chỗ có cả người đã đăng ký và giữ chỗ', () => {
    expect(
      classCapacity({ capacity: 2, enrolledCount: 1, heldSeats: 1, seatsRemaining: 0 }),
    ).toEqual({
      capacity: 2,
      enrolledCount: 1,
      heldSeats: 1,
      seatsRemaining: 0,
      bookedPercent: 50,
      heldPercent: 50,
    });
  });
  it('không suy ra số người đăng ký từ số chỗ còn lại', () => {
    expect(classCapacity({ capacity: 10, seatsRemaining: 3 })).toBeNull();
  });
  it('giữ nguyên số liệu API, giới hạn chiều dài thanh khi dữ liệu không đồng nhất', () => {
    const data = classCapacity({ capacity: 2, enrolledCount: 3, heldSeats: 1, seatsRemaining: 0 });
    expect(data.enrolledCount).toBe(3);
    expect(data.bookedPercent + data.heldPercent).toBe(100);
  });
  it('lớp trống và API cũ không có trường giữ chỗ', () => {
    expect(classCapacity({ capacity: 10, enrolledCount: 0, seatsRemaining: 10 }).heldPercent).toBe(
      0,
    );
  });
  it.each([0, -1, null])('không dựng tỷ lệ khi sức chứa không hợp lệ: %s', (capacity) => {
    expect(classCapacity({ capacity, enrolledCount: 1, seatsRemaining: 0 })).toBeNull();
  });
});
