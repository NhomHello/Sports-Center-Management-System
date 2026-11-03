import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseOrderPrice } from './CourseOrderPrice';

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
});
