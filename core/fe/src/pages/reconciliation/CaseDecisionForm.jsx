import { Button, Form, Input, Popconfirm } from 'antd';

const COPY = Object.freeze({
  reject: {
    label: 'Lý do từ chối (gửi cho hội viên)',
    button: 'Từ chối phiếu',
    confirm: 'Từ chối và báo hội viên chưa tìm thấy giao dịch?',
  },
  ignore: {
    label: 'Ghi chú vì sao bỏ qua',
    button: 'Bỏ qua giao dịch',
    confirm: 'Chỉ bỏ qua giao dịch thử/rác không thuộc hội viên nào. Tiếp tục?',
  },
});

/** Từ chối phiếu báo đã chuyển hoặc bỏ qua giao dịch rác; luôn bắt buộc ghi chú. */
export function CaseDecisionForm({ action, pending, disabled, onAction }) {
  const [form] = Form.useForm();
  const copy = COPY[action];
  return (
    <Form
      form={form}
      layout="vertical"
      disabled={pending || disabled}
      onFinish={(data) => onAction({ action, data })}
    >
      <Form.Item
        name="note"
        label={copy.label}
        rules={[{ required: true, whitespace: true, message: 'Nhập ghi chú' }]}
      >
        <Input.TextArea />
      </Form.Item>
      <Popconfirm
        title={copy.confirm}
        okText="Đồng ý"
        cancelText="Hủy"
        disabled={pending || disabled}
        onConfirm={() => form.submit()}
      >
        <Button loading={pending}>{copy.button}</Button>
      </Popconfirm>
    </Form>
  );
}
