import { Button, Form, Input, InputNumber, Alert } from 'antd';
/** Xác nhận số tiền thực nhận từ sao kê; không cho tự sửa giá hóa đơn. */
export function CaseConfirmForm({ onSubmit, pending, disabled = false }) {
  return (
    <Form layout="vertical" onFinish={onSubmit} disabled={pending || disabled}>
      <Alert
        type="info"
        showIcon
        title="Đối chiếu sao kê trước khi xác nhận. Chỉ khoản thực nhận được ghi vào hóa đơn."
      />
      <Form.Item
        name="amount"
        label="Số tiền thực nhận (VND)"
        rules={[{ required: true, message: 'Nhập số tiền thực nhận' }]}
      >
        <InputNumber min={1} precision={0} />
      </Form.Item>
      <Form.Item
        name="reference"
        label="Mã tham chiếu ngân hàng"
        rules={[{ required: true, whitespace: true, message: 'Nhập mã tham chiếu' }]}
      >
        <Input />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={pending}>
        Xác nhận thanh toán
      </Button>
    </Form>
  );
}
