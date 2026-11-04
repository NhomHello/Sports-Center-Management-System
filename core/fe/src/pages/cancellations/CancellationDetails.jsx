import { PAYOUT_LABELS } from './cancellationHistory';
import { Alert, Button, Descriptions, Modal, Typography } from 'antd';
import { Link } from 'react-router';
import { PERMISSIONS as P } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { ROUTES } from '@/constants';
import { formatCurrency, formatDateTime } from '@/utils/format';

const count = (value) => (value === null ? 'Chưa ghi lại ở dữ liệu cũ' : value);
function RefundCompletion({ refund }) {
  if (!refund) return null;
  return (
    <Descriptions bordered size="small" column={1}>
      {refund.completedAt && (
        <Descriptions.Item label="Hoàn tất lúc">
          {formatDateTime(refund.completedAt)}
        </Descriptions.Item>
      )}
      {refund.reference && (
        <Descriptions.Item label="Tham chiếu chuyển trả">{refund.reference}</Descriptions.Item>
      )}
    </Descriptions>
  );
}

/** Chi tiết bất biến của lần hủy, trạng thái chuyển trả được cập nhật từ yêu cầu hoàn liên kết. */
export function CancellationDetails({ item, onClose }) {
  const { can } = usePermission();
  if (!item) return null;
  return (
    <Modal
      open
      title="Chi tiết hủy khóa học"
      onCancel={onClose}
      footer={<Button onClick={onClose}>Đóng</Button>}
    >
      {item.refund?.status === 'PENDING' && (
        <Alert
          showIcon
          type="info"
          title={`Mã hoàn tiền: ${item.refund.code}`}
          description="Vui lòng liên hệ admin và cung cấp mã này để được chuyển trả. Chỉ khi trung tâm xác nhận hoàn xong, trạng thái mới đổi thành Đã hoàn tiền."
        />
      )}
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Hội viên">{item.member.fullName}</Descriptions.Item>
        <Descriptions.Item label="Khóa học">{item.courseName}</Descriptions.Item>
        <Descriptions.Item label="Hóa đơn gốc">{item.invoice.code}</Descriptions.Item>
        <Descriptions.Item label="Thời điểm hủy">
          {formatDateTime(item.cancelledAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Người thực hiện">{item.actor.fullName}</Descriptions.Item>
        <Descriptions.Item label="Lý do">{item.reason ?? 'Không ghi lại'}</Descriptions.Item>
        <Descriptions.Item label="Số buổi đã mua">
          {count(item.purchasedSessions)}
        </Descriptions.Item>
        <Descriptions.Item label="Số buổi đã diễn ra">{count(item.usedSessions)}</Descriptions.Item>
        <Descriptions.Item label="Buổi trung tâm đã hủy/trả riêng">
          {count(item.cancelledSessions)}
        </Descriptions.Item>
        <Descriptions.Item label="Số buổi chưa diễn ra">
          {count(item.remainingSessions)}
        </Descriptions.Item>
        <Descriptions.Item label="Học phí đã chốt">
          {formatCurrency(item.paidAmount)}
        </Descriptions.Item>
        <Descriptions.Item label="Giá trị chưa sử dụng">
          {formatCurrency(item.remainingValue)}
        </Descriptions.Item>
        <Descriptions.Item label="Phí hủy">{formatCurrency(item.fee)}</Descriptions.Item>
        <Descriptions.Item label="Số tiền hoàn">
          {formatCurrency(item.refundAmount)}
        </Descriptions.Item>
        <Descriptions.Item label="Mã hoàn tiền">
          {item.refund ? <Typography.Text copyable>{item.refund.code}</Typography.Text> : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Xử lý tiền">{PAYOUT_LABELS[item.payoutStatus]}</Descriptions.Item>
      </Descriptions>
      <RefundCompletion refund={item.refund} />
      <Alert
        type="info"
        showIcon
        title="Dữ liệu buổi đã học được giữ lại"
        description="Hủy đăng ký chỉ dừng quyền học các buổi còn lại. Hóa đơn, thanh toán, điểm danh và nhận xét đã ghi không bị xóa."
      />
      {can(P.INVOICE_READ_OWN, P.INVOICE_READ_ALL) && (
        <Link to={`${ROUTES.PAYMENTS}?invoice=${item.invoice.id}`}>Xem hóa đơn gốc</Link>
      )}
    </Modal>
  );
}
