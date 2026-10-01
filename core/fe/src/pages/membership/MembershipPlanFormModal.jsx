import { useEffect } from 'react';
import { App, Form, Input, InputNumber, Modal, Switch } from 'antd';

/** Modal tạo hoặc sửa thông tin gói tập. @param {{ open: boolean, plan?: object, onClose: () => void, onSubmit: (data: object) => void, loading: boolean }} props */
export function MembershipPlanFormModal({ open, plan, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      ...plan,
      benefitsText: plan?.benefits?.join('\n') ?? '',
      isActive: plan?.isActive ?? true,
    });
  }, [form, open, plan]);

  const handleFinish = ({ benefitsText, ...values }) => {
    const benefits = (benefitsText ?? '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    if (benefits.length > 12) {
      message.error('Gói tập chỉ được có tối đa 12 quyền lợi');
      return;
    }
    onSubmit({ ...values, benefits });
  };

  return (
    <Modal
      open={open}
      title={plan ? 'Chỉnh sửa gói tập' : 'Tạo gói tập mới'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={loading}
      onOk={form.submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        {!plan && (
          <Form.Item
            name="code"
            label="Mã gói"
            rules={[{ required: true, message: 'Vui lòng nhập mã gói' }]}
          >
            <Input placeholder="Ví dụ: MONTHLY_1" />
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="Tên gói"
          rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
        >
          <Input placeholder="Ví dụ: Gói 1 tháng" />
        </Form.Item>
        <Form.Item
          name="durationDays"
          label="Thời hạn (ngày)"
          rules={[{ required: true, message: 'Vui lòng nhập thời hạn gói' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="Ví dụ: 30" />
        </Form.Item>
        <Form.Item
          name="price"
          label="Giá tiền (VNĐ)"
          rules={[{ required: true, message: 'Vui lòng nhập giá tiền' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="Ví dụ: 500000" />
        </Form.Item>
        <Form.Item name="benefitsText" label="Quyền lợi (mỗi dòng một quyền lợi)">
          <Input.TextArea rows={4} placeholder="Ví dụ:&#10;Tập gym không giới hạn thời gian&#10;Tham gia mọi lớp Yoga" />
        </Form.Item>
        <Form.Item name="isActive" label="Đang mở bán" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
