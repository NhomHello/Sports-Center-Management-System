import { useMutation } from '@tanstack/react-query';
import { Alert, DatePicker, Form, Input, InputNumber, Modal } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { createClaim } from '@/services/sprint3.service';
import { vietnamTimestamp } from '@/utils/schedule';

/** BR-PAY-20: báo đã chuyển chỉ mở phiếu để đối chiếu, không xác nhận PAID. */
export function PaymentClaimModal({ invoice, onClose }) {
  const [form] = Form.useForm();
  const save = useMutation({
    mutationFn: ({ transferredAt, ...data }) =>
      createClaim(invoice.id, { ...data, transferredAt: vietnamTimestamp(transferredAt) }),
    onError: (error) => form.setFields(error.toFormFields()),
  });
  return (
    <Modal
      open
      title="Tôi đã chuyển khoản"
      onCancel={onClose}
      onOk={() => (save.isSuccess ? onClose() : form.submit())}
      confirmLoading={save.isPending}
      okText={save.isSuccess ? 'Đóng' : 'Gửi để đối chiếu'}
      cancelText="Đóng"
    >
      {save.isSuccess ? (
        <Alert
          showIcon
          type="success"
          title="Đã gửi phiếu đối chiếu"
          description="Trung tâm sẽ kiểm tra giao dịch. Hóa đơn chỉ được xác nhận khi đã đối chiếu tiền."
        />
      ) : (
        <>
          <Alert showIcon type="info" title="Mỗi hóa đơn chỉ có một phiếu báo đã chuyển đang mở." />
          {save.isError && (
            <Alert
              showIcon
              type="error"
              title={save.error.message}
              description={
                !save.error.status
                  ? 'Đang kết nối lại. Giữ thông tin này và kiểm tra trước khi gửi lại; không tạo hóa đơn mới.'
                  : undefined
              }
            />
          )}
          <Form form={form} layout="vertical" onFinish={save.mutate}>
            <Form.Item
              name="transferredAt"
              label="Thời điểm chuyển (giờ Việt Nam)"
              rules={[{ required: true }]}
            >
              <DatePicker showTime format={DATE_FORMATS.DATE_TIME} />
            </Form.Item>
            <Form.Item name="amount" label="Số tiền đã chuyển" rules={[{ required: true }]}>
              <InputNumber min={1} precision={0} />
            </Form.Item>
            <Form.Item
              name="bankName"
              label="Ngân hàng chuyển"
              rules={[{ required: true, whitespace: true }]}
            >
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item name="reference" label="Mã giao dịch">
              <Input maxLength={191} />
            </Form.Item>
            <Form.Item name="note" label="Ghi chú">
              <Input.TextArea maxLength={2000} />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
