import { CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons';
import { Alert, Descriptions, Image, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { INVOICE_CHANNEL, INVOICE_STATUS } from '@/constants';
import { formatCurrency, formatDateTime } from '@/utils/format';

const TICK_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const PAD_WIDTH = 2;

const useRemainingSeconds = (expiresAt) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / TICK_MS));
};

const formatCountdown = (seconds) =>
  `${String(Math.floor(seconds / SECONDS_PER_MINUTE)).padStart(PAD_WIDTH, '0')}:${String(
    seconds % SECONDS_PER_MINUTE,
  ).padStart(PAD_WIDTH, '0')}`;

function PendingPanel({ instruction, currency }) {
  const remaining = useRemainingSeconds(instruction.expiresAt);
  return (
    <Space orientation="vertical" align="center" size="middle" className="scms-full-width">
      <Alert
        showIcon
        icon={<ClockCircleOutlined />}
        type={remaining > 0 ? 'info' : 'warning'}
        message={
          remaining > 0
            ? `Quét mã để chuyển khoản. Hóa đơn hết hạn sau ${formatCountdown(remaining)}`
            : 'Hóa đơn đã quá hạn thanh toán. Nếu bạn đã chuyển khoản, bấm "Tôi đã chuyển khoản" để trung tâm kiểm tra.'
        }
      />
      {instruction.receivedAmount > 0 && (
        <Alert
          showIcon
          type="warning"
          title="Cần chuyển bù"
          description={`Đã nhận ${formatCurrency(instruction.receivedAmount, currency)} / còn thiếu ${formatCurrency(instruction.amount, currency)}. Chuyển bù bằng cùng mã hóa đơn trước hạn bên dưới.`}
        />
      )}
      <Image src={instruction.qrUrl} alt="Mã QR chuyển khoản" width={240} preview={false} />
      <Descriptions bordered size="small" column={1} className="scms-full-width">
        <Descriptions.Item label="Ngân hàng">{instruction.bankCode}</Descriptions.Item>
        <Descriptions.Item label="Số tài khoản">
          <Typography.Text copyable>{instruction.accountNumber}</Typography.Text>
        </Descriptions.Item>
        {instruction.accountName && (
          <Descriptions.Item label="Chủ tài khoản">{instruction.accountName}</Descriptions.Item>
        )}
        <Descriptions.Item
          label={instruction.receivedAmount > 0 ? 'Số tiền cần chuyển bù' : 'Số tiền cần chuyển'}
        >
          <Typography.Text strong>{formatCurrency(instruction.amount, currency)}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Nội dung (bắt buộc đúng)">
          <Typography.Text copyable strong>
            {instruction.content}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Hạn thanh toán">
          {formatDateTime(instruction.expiresAt)}
        </Descriptions.Item>
      </Descriptions>
      <Typography.Text type="secondary">
        Trang tự cập nhật khi hệ thống nhận được tiền, không cần tải lại.
      </Typography.Text>
    </Space>
  );
}

/** Hóa đơn online: hiện QR khi chờ thanh toán, báo thành công khi webhook đã xác nhận. */
export function OnlinePaymentPanel({ invoice }) {
  if (invoice.status === INVOICE_STATUS.PAID && invoice.channel === INVOICE_CHANNEL.ONLINE) {
    return (
      <Alert
        showIcon
        type="success"
        className="scms-online-paid"
        style={{ marginBottom: 16 }}
        icon={<CheckCircleFilled />}
        message="Đã nhận thanh toán. Gói tập của bạn đã được kích hoạt."
      />
    );
  }
  if (!invoice.paymentInstruction) {
    const pendingOnline =
      invoice.status === INVOICE_STATUS.PENDING && invoice.channel === INVOICE_CHANNEL.ONLINE;
    if (!pendingOnline) return null;
    // BE ngừng trả QR khi hoá đơn đã quá hạn (job chưa kịp chuyển trạng thái).
    if (new Date(invoice.expiresAt) <= new Date())
      return (
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16 }}
          message="Hóa đơn đã quá hạn thanh toán"
          description='Không chuyển khoản vào hóa đơn này nữa. Nếu bạn đã chuyển, bấm "Tôi đã chuyển khoản" để trung tâm kiểm tra; nếu chưa, hãy tạo hóa đơn mới từ trang Gói tập.'
        />
      );
    // BE trả paymentInstruction rỗng khi chưa cấu hình tài khoản nhận tiền: báo rõ thay vì để trống.
    return (
      <Alert
        showIcon
        type="warning"
        style={{ marginBottom: 16 }}
        message="Chưa thể hiển thị mã QR"
        description="Trung tâm chưa cấu hình tài khoản nhận tiền online. Vui lòng liên hệ lễ tân để thanh toán tại quầy."
      />
    );
  }
  return <PendingPanel instruction={invoice.paymentInstruction} currency={invoice.currency} />;
}
