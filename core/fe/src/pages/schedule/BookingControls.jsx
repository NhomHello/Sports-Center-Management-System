import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Popconfirm } from 'antd';
import { formatDateTime } from '@/utils/format';
import { WAITLIST_STATUS } from '@/constants/schedule';
const deadline = (item) => formatDateTime(item.cancellationExceptionUntil || item.cancelDeadline);
const hasCompactCancellation = (item, compact) =>
  compact && item.canCancel && !item.cancellationExceptionUntil;

/** Xác nhận giữ chỗ toàn lớp. */
export function BookingEnrollButton({ item, memberId, allowed, booked, mutation }) {
  if (!allowed || booked) return null;
  const label = memberId ? 'Đăng ký hộ' : 'Đăng ký lớp';
  return (
    <>
      <Popconfirm
        title={memberId ? 'Đăng ký toàn lớp cho hội viên đã chọn?' : 'Đăng ký toàn lớp?'}
        description={
          <div className="scms-booking-confirmation">
            <p>Đăng ký áp dụng cho các buổi còn lại của lớp.</p>
            <p>Hạn đăng ký: {formatDateTime(item.registrationEndAt)}</p>
            <p>Hạn hủy buổi gần nhất: {deadline(item) || 'Theo quy định của lớp'}</p>
          </div>
        }
        onConfirm={() => mutation.mutate()}
        disabled={!item.canEnroll}
        okText="Đăng ký"
        cancelText="Hủy"
      >
        <Button type="primary" disabled={!item.canEnroll} loading={mutation.isPending}>
          {item.waitlist?.status === WAITLIST_STATUS.OFFERED ? 'Xác nhận đăng ký' : label}
        </Button>
      </Popconfirm>
    </>
  );
}

/** Xác nhận hủy dùng hạn từ DTO. */
export function BookingCancelButton({ item, memberId, allowed, booked, mutation }) {
  if (!allowed || !booked) return null;
  return (
    <Popconfirm
      title="Hủy đăng ký toàn lớp?"
      description={`Hủy đăng ký cho các buổi còn lại của lớp. Hạn hủy: ${deadline(item)}`}
      onConfirm={() => mutation.mutate()}
      disabled={!item.canCancel}
      okText="Hủy đăng ký"
      cancelText="Giữ đăng ký"
    >
      <Button danger disabled={!item.canCancel} loading={mutation.isPending}>
        {memberId ? 'Hủy hộ' : 'Hủy đăng ký'}
      </Button>
    </Popconfirm>
  );
}

function EnrollmentBlockReason({ item }) {
  return item.enrollReason ? (
    <p className="scms-booking-note">
      <InfoCircleOutlined />
      <span>
        {new Date(item.bookingBlockedUntil) > new Date()
          ? `Tạm chặn do vắng nhiều buổi. Được đăng ký lại từ ${formatDateTime(item.bookingBlockedUntil)}`
          : item.enrollReason}
      </span>
    </p>
  ) : null;
}

/** Giải thích nút bị chặn; hạn hủy đã có trong chi tiết và bước xác nhận. */
export function BookingNotice({ item, booked, allowed, compact = false, hideReason = false }) {
  if (!allowed) return null;
  if (!booked) return hideReason ? null : <EnrollmentBlockReason item={item} />;
  if (hasCompactCancellation(item, compact)) return null;
  return (
    <>
      <p className="scms-booking-note">
        <InfoCircleOutlined />
        <span>{item.canCancel ? `Hạn hủy lớp: ${deadline(item)}` : item.cancelReason}</span>
      </p>
      {item.cancellationExceptionUntil && (
        <Alert
          type="warning"
          showIcon
          title="Lớp đổi lịch gây trùng giờ. Bạn được hủy trước buổi xung đột đầu tiên."
        />
      )}
    </>
  );
}
