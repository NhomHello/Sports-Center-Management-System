import { usePaymentDeadline } from '@/hooks/usePaymentDeadline';
import { Alert } from 'antd';
import { formatDateTime } from '@/utils/format';

/** Thời gian ngân hàng đồng bộ không cho phép tiếp tục thu/chuyển tiền. */
export function PaymentDeadlineNotice({ invoice }) {
  const { now, expired } = usePaymentDeadline(invoice);
  if (!expired || invoice.status !== 'PENDING') return null;
  const awaiting = invoice.channel === 'ONLINE' && new Date(invoice.holdReleaseAt).getTime() > now;
  return (
    <Alert
      showIcon
      type="warning"
      title={awaiting ? 'Hết hạn chuyển tiền, đang chờ xác nhận ngân hàng' : 'Hết hạn giữ chỗ'}
      description={
        awaiting
          ? `Không chuyển thêm tiền. Hệ thống chờ đến ${formatDateTime(invoice.holdReleaseAt)} để nhận thông báo cho khoản đã chuyển đúng hạn. Nếu chưa xác nhận được, chỗ sẽ được nhả và tiền đã chuyển cần đối soát.`
          : 'Không thu/chuyển thêm vào hóa đơn này. Nếu đã giao tiền mặt, nhân viên cần trả lại hoặc thống nhất đăng ký lại sau khi kiểm tra chỗ. Tiền đã chuyển khoản cần đối soát.'
      }
    />
  );
}
