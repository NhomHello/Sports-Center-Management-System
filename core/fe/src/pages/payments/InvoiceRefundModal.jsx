import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Descriptions, Form, Input, Modal } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { requestRefund, completeRefund } from '@/services/sprint3.service';
import { formatCurrency } from '@/utils/format';

/** Cảnh báo hệ quả trước khi tạo yêu cầu và hướng dẫn bước chuyển trả sau đó. */
function RefundNotice({ invoice, requested }) {
  if (requested)
    return (
      <Alert
        showIcon
        type="warning"
        title="Yêu cầu đã tạo, đang chờ chuyển trả"
        description="Chuyển trả thủ công ngoài hệ thống rồi nhập mã tham chiếu ngân hàng để hoàn tất."
      />
    );
  return (
    <Alert
      showIcon
      type="warning"
      title="Hoàn toàn bộ hóa đơn — không hoàn một phần"
      description={`Khi tạo yêu cầu: hóa đơn chuyển sang "Đã hoàn tiền" và ${invoice.durationDays ?? invoice.plan?.durationDays ?? ''} ngày gói tập đã cộng từ hóa đơn này bị rút lại ngay. Phần chuyển thừa hãy hoàn ở Hàng chờ đối soát, không hoàn ở đây.`}
    />
  );
}

/** Số tiền hoàn chỉ để đọc: server tự tính toàn bộ số thực nhận còn lại. */
function RequestFields({ invoice, refundable }) {
  return (
    <>
      <Descriptions bordered size="small" column={1} className="scms-full-width">
        <Descriptions.Item label="Số tiền sẽ hoàn">
          <strong>{formatCurrency(refundable, invoice.currency)}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Gói bị rút ngày">
          {invoice.planName ?? invoice.plan?.name ?? '—'}
        </Descriptions.Item>
      </Descriptions>
      <Form.Item name="reason" label="Lý do hoàn" rules={[{ required: true, whitespace: true }]}>
        <Input.TextArea maxLength={1000} />
      </Form.Item>
    </>
  );
}

/** Yêu cầu hoàn và xác nhận đã chuyển trả là hai bước theo contract backend. */
export function InvoiceRefundModal({ invoice, onClose }) {
  const [form] = Form.useForm();
  const client = useQueryClient();
  const { message } = App.useApp();
  const request = useMutation({
    mutationFn: (data) => requestRefund(invoice.id, data),
    onSuccess: () => {
      message.success('Đã tạo yêu cầu hoàn tiền. Chuyển trả rồi nhập mã tham chiếu.');
      client.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
    },
  });
  const complete = useMutation({
    mutationFn: ({ reference }) => completeRefund(request.data.data.id, reference),
    onSuccess: () => {
      message.success('Đã xác nhận chuyển trả cho hội viên');
      client.invalidateQueries({ queryKey: ['refunds'] });
      onClose();
    },
  });
  // BE chỉ hoàn toàn bộ số thực nhận còn lại (đã trừ các khoản hoàn trước); FE không gửi số tiền.
  const refundable =
    invoice.refundableAmount ?? invoice.payments.reduce((s, p) => s + p.receivedAmount, 0);
  const error = complete.error || request.error;
  return (
    <Modal
      open
      title="Hoàn tiền hóa đơn"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={request.isPending || complete.isPending}
      okText={request.isSuccess ? 'Xác nhận đã chuyển trả' : 'Tạo yêu cầu hoàn'}
      cancelText="Đóng"
    >
      <RefundNotice invoice={invoice} requested={request.isSuccess} />
      {error && <Alert showIcon type="error" title={error.message} />}
      <Form
        key={String(request.isSuccess)}
        form={form}
        layout="vertical"
        onFinish={request.isSuccess ? complete.mutate : ({ reason }) => request.mutate({ reason })}
      >
        {request.isSuccess ? (
          <Form.Item
            name="reference"
            label="Mã tham chiếu chuyển trả"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={191} />
          </Form.Item>
        ) : (
          <RequestFields invoice={invoice} refundable={refundable} />
        )}
      </Form>
    </Modal>
  );
}
