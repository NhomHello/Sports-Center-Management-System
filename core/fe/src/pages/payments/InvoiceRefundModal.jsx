import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Form, Input, InputNumber, Modal } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { requestRefund, completeRefund } from '@/services/sprint3.service';
import { formatCurrency } from '@/utils/format';

/** Yêu cầu hoàn và xác nhận đã chuyển trả là hai bước theo contract backend. */
export function InvoiceRefundModal({ invoice, onClose }) {
  const [form] = Form.useForm();
  const client = useQueryClient();
  const request = useMutation({
    mutationFn: (data) => requestRefund(invoice.id, data),
    onSuccess: () => client.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES }),
  });
  const complete = useMutation({
    mutationFn: ({ reference }) => completeRefund(request.data.data.id, reference),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['refunds'] });
      onClose();
    },
  });
  const maximum = invoice.payments.reduce((s, p) => s + p.receivedAmount, 0);
  const error = complete.error || request.error;
  return (
    <Modal
      open
      title="Hoàn tiền hoá đơn"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={request.isPending || complete.isPending}
      okText={request.isSuccess ? 'Xác nhận đã chuyển trả' : 'Tạo yêu cầu hoàn'}
      cancelText="Đóng"
    >
      <Alert
        showIcon
        type="warning"
        title={
          request.isSuccess
            ? 'Yêu cầu đã tạo, đang chờ chuyển trả'
            : `Tối đa ${formatCurrency(maximum, invoice.currency)}`
        }
        description="Tiền được trả thủ công ngoài hệ thống. Hoá đơn chuyển sang Đã hoàn tiền và số ngày đã cộng vào gói sẽ bị rút lại khi tạo yêu cầu."
      />
      {error && <Alert showIcon type="error" title={error.message} />}
      <Form
        key={String(request.isSuccess)}
        form={form}
        layout="vertical"
        initialValues={{ amount: maximum }}
        onFinish={request.isSuccess ? complete.mutate : request.mutate}
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
          <>
            <Form.Item name="amount" label="Số tiền hoàn" rules={[{ required: true }]}>
              <InputNumber min={1} max={maximum} precision={0} />
            </Form.Item>
            <Form.Item
              name="reason"
              label="Lý do hoàn"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input.TextArea maxLength={1000} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
}
