import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Popconfirm } from 'antd';
import { formatDateTime } from '@/utils/format';
const deadline = (item) => formatDateTime(item.cancellationExceptionUntil || item.cancelDeadline);

/** Xác nhận giữ chỗ toàn lớp. */
export function BookingEnrollButton({ item, memberId, allowed, booked, mutation }) {
  if (!allowed || booked) return null;
  const label = memberId ? 'Đăng ký hộ' : 'Đăng ký lớp';
  return (
    <Popconfirm
      title={memberId ? 'Đăng ký toàn lớp cho hội viên đã chọn?' : 'Đăng ký toàn lớp?'}
      onConfirm={() => mutation.mutate()}
      disabled={!item.canEnroll}
      okText="Đăng ký"
      cancelText="Huỷ"
    >
      <Button type="primary" disabled={!item.canEnroll} loading={mutation.isPending}>
        {label}
      </Button>
    </Popconfirm>
  );
}

/** Xác nhận huỷ dùng hạn từ DTO. */
export function BookingCancelButton({ item, memberId, allowed, booked, mutation }) {
  if (!allowed || !booked) return null;
  return (
    <Popconfirm
      title="Huỷ đăng ký toàn lớp?"
      description={`Huỷ đăng ký cho các buổi còn lại của lớp. Hạn huỷ: ${deadline(item)}`}
      onConfirm={() => mutation.mutate()}
      disabled={!item.canCancel}
      okText="Huỷ đăng ký"
      cancelText="Giữ đăng ký"
    >
      <Button danger disabled={!item.canCancel} loading={mutation.isPending}>
        {memberId ? 'Huỷ hộ' : 'Huỷ đăng ký'}
      </Button>
    </Popconfirm>
  );
}

/** Giải thích nút bị chặn hoặc ngoại lệ do đổi lịch. */
export function BookingNotice({ item, booked, allowed }) {
  if (!allowed) return null;
  if (!booked)
    return item.enrollReason ? (
      <p className="scms-booking-note">
        <InfoCircleOutlined />
        <span>{item.enrollReason}</span>
      </p>
    ) : null;
  return (
    <>
      <p className="scms-booking-note">
        <InfoCircleOutlined />
        <span>{item.canCancel ? `Hạn huỷ lớp: ${deadline(item)}` : item.cancelReason}</span>
      </p>
      {item.cancellationExceptionUntil && (
        <Alert
          type="warning"
          showIcon
          title="Lớp đổi lịch gây trùng giờ. Bạn được huỷ trước buổi xung đột đầu tiên."
        />
      )}
    </>
  );
}
