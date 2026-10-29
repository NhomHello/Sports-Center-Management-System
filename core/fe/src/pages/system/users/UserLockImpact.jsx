import { Button, Listy } from 'antd';
import { formatDateTime } from '@/utils/format';
/** Lịch bị ảnh hưởng được lấy từ server trước bước xác nhận. */
export function UserLockImpact({ impact, onManage }) {
  if (impact.classes.length)
    return (
      <>
        <Listy rowKey="id" items={impact.classes} itemRender={(c) => c.name} />
        <Button onClick={onManage}>Đến quản lý lớp để đổi HLV</Button>
      </>
    );
  return impact.bookings.length ? (
    <Listy
      rowKey="id"
      items={impact.bookings}
      itemRender={(b) => (
        <>
          {b.gymClass.name}: {b.gymClass.sessions.map((s) => formatDateTime(s.startAt)).join(', ')}
        </>
      )}
    />
  ) : (
    'Tài khoản sẽ không thể đăng nhập cho tới khi được mở khóa.'
  );
}
