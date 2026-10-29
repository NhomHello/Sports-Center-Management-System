import { App, Button, Dropdown, Popconfirm } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { WAITLIST_STATUS } from '@/constants/schedule';
import { getWaitlistAction } from '@/utils/classBookingPresentation';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { joinWaitlist, leaveWaitlist } from '@/services/sprint3.service';
import { formatDateTime } from '@/utils/format';

function WaitlistMenu({ mutation }) {
  const { modal } = App.useApp();
  const items = [
    {
      key: 'leave',
      label: 'Rời danh sách chờ',
      danger: true,
      onClick: () =>
        modal.confirm({
          title: 'Rời danh sách chờ?',
          okText: 'Rời danh sách',
          cancelText: 'Ở lại',
          onOk: () => mutation.mutateAsync(),
        }),
    },
  ];
  return (
    <Dropdown trigger={['click']} menu={{ items }}>
      <Button
        type="text"
        aria-label="Thao tác danh sách chờ"
        icon={<MoreOutlined aria-hidden="true" />}
        loading={mutation.isPending}
      />
    </Dropdown>
  );
}

/** BR-2.16: chỗ được giữ vẫn phải xác nhận bằng đăng ký lớp, không tự tạo booking. */
export function WaitlistControls({ item, allowed, booked, memberId, compact = false }) {
  const join = useScheduleMutation(() => joinWaitlist(item.id));
  const leave = useScheduleMutation(() => leaveWaitlist(item.id));
  const action = getWaitlistAction({ item, allowed, booked, memberId });
  if (!action) return null;
  if (action === 'leave')
    return (
      <>
        {!compact && <WaitlistNotice {...{ item, allowed, booked, memberId }} />}
        {compact ? (
          <WaitlistMenu mutation={leave} />
        ) : (
          <Popconfirm
            title="Rời danh sách chờ?"
            okText="Rời danh sách"
            cancelText="Ở lại"
            onConfirm={() => leave.mutateAsync()}
          >
            <Button loading={leave.isPending}>Rời danh sách chờ</Button>
          </Popconfirm>
        )}
      </>
    );
  // Chỉ mời vào chờ khi lý do duy nhất là lớp đủ chỗ; bị chặn/trùng lịch/hết gói thì BE sẽ từ chối.
  return (
    <Button type="primary" onClick={() => join.mutate()} loading={join.isPending}>
      Vào danh sách chờ
    </Button>
  );
}

export function WaitlistNotice({ item, allowed, booked, memberId }) {
  if (getWaitlistAction({ item, allowed, booked, memberId }) !== 'leave') return null;
  return (
    <p className="scms-booking-note scms-booking-note--waitlist">
      {item.waitlist.status === WAITLIST_STATUS.OFFERED
        ? `Giữ đến ${formatDateTime(item.waitlist.offeredUntil)}`
        : 'Sẽ thông báo khi có chỗ trống.'}
    </p>
  );
}
