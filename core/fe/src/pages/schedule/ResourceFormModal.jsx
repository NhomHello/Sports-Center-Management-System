import { Form, Input, InputNumber, Modal, Switch } from 'antd';

/** Form dùng chung cho bộ môn và phòng tập. */
export function ResourceFormModal({ item, resource, loading, onSubmit, onClose }) {
  const [form] = Form.useForm();

  return (
    <Modal
      open
      title={item ? 'Sửa thông tin' : 'Thêm danh mục'}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={loading}
      onOk={form.submit}
      onCancel={onClose}
      forceRender
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={item || { isActive: true }}
        scrollToFirstError={{ focus: true }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, whitespace: true, min: 2, max: 100 }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        {resource === 'rooms' && (
          <Form.Item
            name="capacity"
            label="Sức chứa"
            rules={[{ required: true, type: 'integer', min: 1 }]}
          >
            <InputNumber min={1} />
          </Form.Item>
        )}
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea maxLength={500} />
        </Form.Item>
        <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
}
