import { Button, List } from 'antd';
import { formatDateTime } from '@/utils/format';
/** Lịch bị ảnh hưởng được lấy từ server trước bước xác nhận. */
export function UserLockImpact({ impact, onManage }) {
  if (impact.classes.length)
    return (
      <>
        <List dataSource={impact.classes} renderItem={(c) => <List.Item>{c.name}</List.Item>} />
        <Button onClick={onManage}>Đến quản lý lớp để đổi HLV</Button>
      </>
    );
  return impact.bookings.length ? (
    <List
      dataSource={impact.bookings}
      renderItem={(b) => (
        <List.Item>
          {b.gymClass.name}: {b.gymClass.sessions.map((s) => formatDateTime(s.startAt)).join(', ')}
        </List.Item>
      )}
    />
  ) : (
    'Tài khoản sẽ không thể đăng nhập cho tới khi được mở khoá.'
  );
}
