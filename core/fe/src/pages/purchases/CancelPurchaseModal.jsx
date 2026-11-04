import { Alert, Descriptions, Form, Input, Modal } from 'antd';
import { formatCurrency } from '@/utils/format';
import { validCancelPreview } from './CancelPurchasePolicy';

function CancellationPreview({ data }) {
  return (
    <Descriptions bordered size="small" column={1}>
      <Descriptions.Item label="Đã thanh toán">{formatCurrency(data.paidAmount)}</Descriptions.Item>
      <Descriptions.Item label="Giá trị chưa sử dụng">
        {formatCurrency(data.remainingValue)}
      </Descriptions.Item>
      <Descriptions.Item label="Phí hủy">{formatCurrency(data.fee)}</Descriptions.Item>
      <Descriptions.Item label="Được hoàn">{formatCurrency(data.refundAmount)}</Descriptions.Item>
    </Descriptions>
  );
}

function PreviewNotice({ query, data }) {
  if (query.isFetching) return <Alert type="info" title="Đang tính quyền lợi hủy…" />;
  if (query.isError)
    return (
      <Alert
        type="error"
        showIcon
        title={query.error.message}
        action={<a onClick={() => query.refetch()}>Thử lại</a>}
      />
    );
  if (!validCancelPreview(data))
    return (
      <Alert type="warning" title="Chưa có bảng tính hợp lệ. Vui lòng tải lại trước khi hủy." />
    );
  return null;
}

/** GY-34: chỉ hiển thị preview; không tự tính lại phí, hoàn hoặc chênh lệch. */
export function CancelPurchaseModal({ kind, query, mutation, onSubmit, onClose }) {
  const [form] = Form.useForm();
  const data = query.data?.data;
  const ready = validCancelPreview(data) && !query.isFetching && !query.isError;
  return (
    <Modal
      open
      title={kind === 'membership' ? 'Hủy gói tự tập' : 'Hủy khóa học'}
      okText="Xác nhận hủy"
      cancelText="Đóng"
      confirmLoading={mutation.isPending}
      okButtonProps={{ danger: true, disabled: !ready }}
      onOk={() => form.submit()}
      closable={!mutation.isPending}
      mask={{ closable: !mutation.isPending }}
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
    >
      <PreviewNotice query={query} data={data} />
      {ready && <CancellationPreview data={data} />}
      {mutation.isError && <Alert type="error" showIcon title={mutation.error.message} />}
      <Form
        form={form}
        layout="vertical"
        disabled={!ready || mutation.isPending}
        onFinish={(values) => {
          if (ready) onSubmit({ ...values, settlement: 'REFUND', reason: values.reason.trim() });
        }}
      >
        <Form.Item
          label="Lý do hủy"
          name="reason"
          rules={[{ required: true, whitespace: true, message: 'Nhập lý do hủy' }]}
        >
          <Input.TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>
      </Form>
      <Alert
        showIcon
        type="info"
        title="Sau khi hủy, xem mã hoàn trong Lịch sử hủy khóa học rồi liên hệ admin cung cấp mã để được chuyển trả. Không ghi vào ví/số dư."
      />
    </Modal>
  );
}
