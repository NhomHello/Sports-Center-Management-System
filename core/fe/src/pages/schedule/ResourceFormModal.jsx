import { useQuery } from '@tanstack/react-query';
import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { QUERY_KEYS } from '@/constants';
import { listRoomTypes } from '@/services/schedule.service';

/** Loại phòng đang hoạt động; nhãn kèm bộ môn để chọn đúng chức năng phòng. */
function RoomTypeField() {
  const types = useQuery({
    queryKey: [...QUERY_KEYS.SCHEDULE, 'room-types'],
    queryFn: listRoomTypes,
  });
  return (
    <Form.Item
      name="roomTypeId"
      label="Loại phòng (chức năng)"
      rules={[{ required: true, message: 'Chọn loại phòng' }]}
      extra="Loại phòng quyết định bộ môn nào được xếp lớp vào phòng này."
    >
      <Select
        loading={types.isPending}
        options={(types.data?.data ?? [])
          .filter((t) => t.isActive)
          .map((t) => ({
            value: t.id,
            label: `${t.name} · ${t.subjects.map((s) => s.name).join(', ') || 'chưa có bộ môn'}`,
          }))}
      />
    </Form.Item>
  );
}

/** Form dùng chung cho bộ môn/phòng; parent quyết định quyền ghi. */
export function ResourceFormModal({ item, resource, loading, onSubmit, onClose }) {
  const [form] = Form.useForm();
  return (
    <Modal
      open
      centered
      title={item ? 'Sửa thông tin' : 'Thêm danh mục'}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError={{ focus: true }}
        initialValues={item || { isActive: true }}
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label="Tên"
          rules={[{ required: true, whitespace: true, min: 2, max: 100 }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        {resource === 'rooms' && <RoomTypeField />}
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
