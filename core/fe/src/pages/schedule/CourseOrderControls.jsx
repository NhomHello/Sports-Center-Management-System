import { Alert, Button, Popconfirm, Space } from 'antd';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/constants';
import { ENROLLMENT_STATUS } from '@/constants/schedule';
import { useScheduleMutation } from '@/hooks/useScheduleMutation';
import { createCourseOrder } from '@/services/courseOrder.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { EnrollmentActions } from './EnrollmentActions';

const invoicePath = (id) => `${ROUTES.PAYMENTS}?invoice=${id}`;

function PendingCourse({ item, cancel }) {
  const navigate = useNavigate();
  const { enrollment } = item;
  return (
    <Space orientation="vertical" style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        title={
          enrollment.holdExpiresAt
            ? `Đang giữ chỗ đến ${formatDateTime(enrollment.holdExpiresAt)}, thanh toán để có chỗ chính thức`
            : 'Đang giữ chỗ, thanh toán tại quầy để có chỗ chính thức'
        }
      />
      <Space wrap>
        <Button type="primary" onClick={() => navigate(invoicePath(enrollment.invoiceId))}>
          Thanh toán khóa học
        </Button>
        <Popconfirm
          title="Bỏ giữ chỗ khóa học?"
          description="Hóa đơn chưa thanh toán sẽ bị hủy và chỗ được nhả cho người khác."
          okText="Bỏ giữ chỗ"
          cancelText="Giữ lại"
          onConfirm={() => cancel.mutate()}
        >
          <Button loading={cancel.isPending}>Bỏ giữ chỗ</Button>
        </Popconfirm>
      </Space>
    </Space>
  );
}

function BuyCourseButton({ item, memberId, order }) {
  return (
    <Popconfirm
      title={memberId ? 'Tạo hóa đơn khóa học tại quầy?' : 'Đăng ký khóa học?'}
      description={`Học phí ${formatCurrency(item.priceForRemaining)} cho ${item.remainingSessions}/${item.totalSessions} buổi còn lại. Thanh toán xong mới có chỗ chính thức.`}
      onConfirm={() => order.mutate()}
      disabled={!item.canEnroll}
      okText="Đăng ký"
      cancelText="Đóng"
    >
      <Button type="primary" disabled={!item.canEnroll} loading={order.isPending}>
        {memberId ? 'Bán khóa học' : 'Đăng ký khóa học'} · {formatCurrency(item.priceForRemaining)}
      </Button>
    </Popconfirm>
  );
}

/**
 * GY-22: lớp có học phí — chưa đăng ký thì mua khóa (giữ chỗ chờ thanh toán), đang giữ chỗ thì
 * thanh toán / bỏ giữ chỗ, đã thanh toán thì hủy / đổi khóa (khe của Khôi).
 */
export function CourseOrderControls({ item, memberId, allowed, cancel }) {
  const navigate = useNavigate();
  const order = useScheduleMutation(
    () => createCourseOrder(item.id, memberId),
    (result) => navigate(invoicePath(result.data.id)),
  );
  const status = item.enrollment?.status;
  if (status === ENROLLMENT_STATUS.PENDING_PAYMENT)
    return <PendingCourse item={item} cancel={cancel} />;
  if (status === ENROLLMENT_STATUS.BOOKED)
    return <EnrollmentActions item={item} memberId={memberId} />;
  if (!allowed) return null;
  return <BuyCourseButton item={item} memberId={memberId} order={order} />;
}
