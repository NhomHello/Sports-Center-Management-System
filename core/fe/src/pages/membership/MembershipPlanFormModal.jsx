import { useEffect } from 'react';
import { App, Form, Input, InputNumber, Modal, Switch } from 'antd';
import { PlanAccessFields } from './PlanAccessFields';

const MembershipIdentityFields = ({ plan }) => (
  <>
    {!plan && (
      <Form.Item
        name="code"
        label="Mã gói"
        normalize={(value) => value?.toUpperCase().replaceAll(' ', '_')}
        rules={[
          { required: true, message: 'Vui lòng nhập mã gói' },
          { pattern: /^[A-Z0-9_]+$/, message: 'Chỉ dùng chữ in hoa, số và dấu gạch dưới' },
        ]}
      >
        <Input maxLength={50} placeholder="Ví dụ: STARTER_30" />
      </Form.Item>
    )}
    <Form.Item
      name="name"
      label="Tên gói"
      rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}
    >
      <Input placeholder="Ví dụ: Gói 1 tháng" />
    </Form.Item>
  </>
);

const ids = (items) => (items ?? []).map((item) => item.id);

const planFormValues = (plan) =>
  plan
    ? {
        ...plan,
        benefitsText: (plan.benefits ?? []).join('\n'),
        frameIds: ids(plan.frames),
        roomTypeIds: ids(plan.areas),
        isActive: plan.isActive ?? true,
      }
    : { benefitsText: '', frameIds: [], roomTypeIds: [], isActive: true };

/** Modal tạo hoặc sửa thông tin gói tập. @param {{ open: boolean, plan?: object, onClose: () => void, onSubmit: (data: object) => void, loading: boolean }} props */
export function MembershipPlanFormModal({ open, plan, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(planFormValues(plan));
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
      centered
      title={plan ? 'Chỉnh sửa gói tự tập' : 'Tạo gói tự tập mới'}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      onOk={form.submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <MembershipIdentityFields plan={plan} />
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
          <InputNumber
            min={1}
            precision={0}
            formatter={(value) => String(value ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(value) => value?.replace(/\./g, '')}
            style={{ width: '100%' }}
            placeholder="Ví dụ: 500.000"
          />
        </Form.Item>
        <PlanAccessFields />
        <Form.Item name="description" label="Mô tả gói">
          <Input.TextArea placeholder="Giới thiệu nội dung và đối tượng phù hợp" />
        </Form.Item>
        <Form.Item name="benefitsText" label="Quyền lợi (mỗi dòng một quyền lợi)">
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ:&#10;Tập gym không giới hạn thời gian&#10;Tham gia mọi lớp Yoga"
          />
        </Form.Item>
        <Form.Item name="isActive" label="Đang mở bán" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
