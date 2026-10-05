import { Form, Input, InputNumber, Select } from 'antd';
import { CLASS_STATUS, SCHEDULE_STATUS_LABELS } from '@/constants/schedule';
const required = [{ required: true, message: 'Vui lòng nhập thông tin' }];
const options = (items) =>
  items.map((item) => ({ value: item.id, label: item.name || item.fullName }));
/** Thông tin lớp và tài nguyên từ API. */
export function ClassIdentityFields({ subjects, rooms, coaches }) {
  return (
    <>
      <Form.Item name="name" label="Tên lớp" rules={required}>
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item name="subjectId" label="Bộ môn" rules={required}>
        <Select options={options(subjects)} virtual={false} />
      </Form.Item>
      <Form.Item name="roomId" label="Phòng tập" rules={required}>
        <Select options={options(rooms)} virtual={false} />
      </Form.Item>
      <Form.Item name="coachId" label="Huấn luyện viên" rules={required}>
        <Select options={options(coaches)} virtual={false} />
      </Form.Item>
      <Form.Item
        name="capacity"
        label="Sức chứa"
        rules={[{ required: true, type: 'integer', min: 1 }]}
      >
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái">
        <Select
          options={[CLASS_STATUS.OPEN, CLASS_STATUS.CLOSED].map((value) => ({
            value,
            label: SCHEDULE_STATUS_LABELS[value],
          }))}
        />
      </Form.Item>
      <Form.Item name="description" label="Mô tả">
        <Input.TextArea maxLength={1000} />
      </Form.Item>
    </>
  );
}
