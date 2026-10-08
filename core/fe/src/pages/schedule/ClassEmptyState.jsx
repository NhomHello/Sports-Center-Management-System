import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { Button } from 'antd';

/** Phân biệt chưa mở đăng ký với không có kết quả lọc; chỉ cung cấp điều hướng được phép. */
export function ClassEmptyState({ scope, filtered, onReset, onViewSchedule }) {
  const isOpen = scope === 'open';
  const title = filtered
    ? 'Không tìm thấy lớp phù hợp'
    : isOpen
      ? 'Hiện chưa có lớp mở đăng ký'
      : 'Chưa có lớp trong phạm vi của bạn';
  const description = filtered
    ? 'Thử một từ khóa khác hoặc xoá điều kiện lọc để xem lại danh sách lớp.'
    : isOpen
      ? 'Các lớp sẽ xuất hiện tại đây khi trung tâm mở đăng ký. Lịch của các lớp đã đăng ký vẫn được giữ lại.'
      : 'Các lớp được tạo hoặc phân công cho bạn sẽ xuất hiện tại đây.';
  return (
    <section className="scms-class-empty" aria-label={title}>
      <span className="scms-class-empty__icon" aria-hidden="true">
        {filtered ? <SearchOutlined /> : <CalendarOutlined />}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {filtered ? (
        <Button onClick={onReset}>Xoá tìm kiếm và bộ lọc</Button>
      ) : (
        isOpen &&
        onViewSchedule && (
          <Button type="primary" onClick={onViewSchedule}>
            Xem lịch tập
          </Button>
        )
      )}
    </section>
  );
}
