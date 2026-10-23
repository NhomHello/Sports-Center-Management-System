import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseOrderPrice } from './CourseOrderPrice';
import { CurrentMembershipCard } from '../membership/CurrentMembershipCard';

describe('Hiển thị sản phẩm theo hợp đồng GY-20', () => {
  it('dùng giá giữa khóa server trả, không suy diễn lại từ giá cả khóa', () => {
    const html = renderToStaticMarkup(
      <CourseOrderPrice
        item={{
          price: 1200000,
          totalSessions: 18,
          remainingSessions: 12,
          priceForRemaining: 799000,
        }}
      />,
    );
    expect(html).toContain('799.000');
    expect(html).toContain('12 buổi còn lại');
    expect(html).not.toContain('800.000');
  });
  it('phân biệt lớp miễn phí và lớp chưa có dữ liệu học phí', () => {
    expect(renderToStaticMarkup(<CourseOrderPrice item={{ price: 0 }} />)).toContain('Miễn phí');
    expect(renderToStaticMarkup(<CourseOrderPrice item={{}} />)).toBe('');
  });
  it('hiện riêng kỳ mua nối tiếp và trạng thái bảo lưu', () => {
    const html = renderToStaticMarkup(
      <CurrentMembershipCard
        canPurchase
        membership={{
          id: 1,
          status: 'FROZEN',
          startDate: '2026-10-01',
          endDate: '2026-11-01',
          plan: { name: 'Tự tập sáng' },
          frames: [{ id: 1, name: 'Sáng sớm', startTime: '05:00', endTime: '09:00' }],
          areas: [{ id: 1, name: 'Phòng máy' }],
          nextPeriods: [
            {
              id: 2,
              status: 'ACTIVE',
              plan: { name: 'Tự tập tối' },
              startDate: '2026-11-01',
              endDate: '2026-12-01',
            },
          ],
        }}
      />,
    );
    for (const text of [
      'Đang bảo lưu',
      'Kỳ tiếp theo',
      'Tự tập sáng',
      'Tự tập tối',
      '05:00',
      '09:00',
      'Phòng máy',
      'Khóa học có đăng ký riêng',
    ])
      expect(html).toContain(text);
    expect(html).not.toContain('Đã hết hạn');
  });
});
