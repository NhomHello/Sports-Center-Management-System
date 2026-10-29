import { Alert, Button, Form, Input, Typography } from 'antd';
import { CASE_REASON } from '@/constants/reconciliation';
import { formatCurrency } from '@/utils/format';
import { overpaidAwaiting } from '@/utils/reconciliationActions';

const HINTS = Object.freeze({
  [CASE_REASON.OVERPAID]:
    'Hoàn phần chuyển thừa; hóa đơn gốc đã chấp nhận vẫn giữ trạng thái đã thanh toán.',
  [CASE_REASON.DUPLICATE_TRANSFER]: 'Hoàn khoản chuyển lặp; gói tập không thay đổi.',
  [CASE_REASON.UNDERPAID]:
    'Hoàn số đã nhận của hóa đơn chưa đủ tiền; hóa đơn sẽ bị hủy và gói không được kích hoạt.',
  [CASE_REASON.NO_MATCH]: 'Hoàn khoản không gán được vào hóa đơn nào cho người đã chuyển.',
  [CASE_REASON.LATE]: 'Hoàn khoản tiền về sau khi hóa đơn đã hết hạn.',
});

/** BR-PAY-13: tạo yêu cầu hoàn, tiền chuyển trả thủ công rồi xác nhận ở Hóa đơn → Theo dõi hoàn tiền. */
export function CaseRefundForm({ item, pending, disabled, onAction }) {
  const hint = overpaidAwaiting(item)
    ? 'Hóa đơn chưa được chấp nhận: hoàn toàn bộ số đã nhận, hóa đơn bị hủy và gói không được kích hoạt.'
    : HINTS[item.reason];
  return (
    <Form
      layout="vertical"
      disabled={pending || disabled}
      onFinish={(data) => onAction({ action: 'refund', data })}
    >
      <Typography.Title level={5}>Hoàn tiền cho hội viên</Typography.Title>
      <Alert
        showIcon
        type="warning"
        title={`Số hoàn tối đa do hệ thống tính (giao dịch ${formatCurrency(item.amount)})`}
        description={hint}
      />
      <Form.Item
        name="reason"
        label="Lý do hoàn tiền"
        rules={[{ required: true, whitespace: true, message: 'Nhập lý do hoàn tiền' }]}
      >
        <Input.TextArea />
      </Form.Item>
      <Button danger htmlType="submit" loading={pending}>
        Tạo yêu cầu hoàn
      </Button>
    </Form>
  );
}
