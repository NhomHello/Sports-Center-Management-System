import { Alert, Button, Popconfirm, Space } from 'antd';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { joinWaitlist, leaveWaitlist } from '@/services/sprint3.service';
import { formatDateTime } from '@/utils/format';

const WAITING = 'WAITING';
const OFFERED = 'OFFERED';
/** BR-2.16: chỗ được giữ vẫn phải xác nhận bằng đăng ký lớp, không tự tạo booking. */
export function WaitlistControls({ item, allowed, booked, memberId }) {
  const join = useScheduleMutation(() => joinWaitlist(item.id));
  const leave = useScheduleMutation(() => leaveWaitlist(item.id));
  if (!allowed || booked || memberId) return null;
  const status = item.waitlist?.status;
  if ([WAITING, OFFERED].includes(status))
    return (
      <Space orientation="vertical">
        <Alert
          showIcon
          type="info"
          title={
            status === OFFERED
              ? `Đã giữ chỗ đến ${formatDateTime(item.waitlist.offeredUntil)}. Bấm Đăng ký lớp để xác nhận.`
              : 'Bạn đang trong danh sách chờ. Trung tâm sẽ thông báo khi có chỗ.'
          }
        />
        <Popconfirm title="Rời danh sách chờ?" onConfirm={() => leave.mutateAsync()}>
          <Button loading={leave.isPending}>Rời danh sách chờ</Button>
        </Popconfirm>
      </Space>
    );
  // Chỉ mời vào chờ khi lý do duy nhất là lớp đủ chỗ; bị chặn/trùng lịch/hết gói thì BE sẽ từ chối.
  if (item.seatsRemaining > 0 || !item.canJoinWaitlist) return null;
  return (
    <Button onClick={() => join.mutate()} loading={join.isPending}>
      Vào danh sách chờ
    </Button>
  );
}
