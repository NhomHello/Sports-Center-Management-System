import { Form, Input, InputNumber, Select } from 'antd';
import { CLASS_STATUS, CLASS_STATUS_LABELS } from '@/constants/schedule';

const REQUIRED_RULE = [{ required: true, message: 'Vui lòng nhập thông tin' }];
const toOptions = (items) =>
  items.map((item) => ({ value: item.id, label: item.name || item.fullName }));

/** Các trường thông tin chung của lớp học. */
export function ClassIdentityFields({ subjects, rooms, coaches }) {
  return (
    <>
      <Form.Item name="name" label="Tên lớp" rules={REQUIRED_RULE}>
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item name="subjectId" label="Bộ môn" rules={REQUIRED_RULE}>
        <Select options={toOptions(subjects)} virtual={false} />
      </Form.Item>
      <Form.Item name="roomId" label="Phòng tập" rules={REQUIRED_RULE}>
        <Select options={toOptions(rooms)} virtual={false} />
      </Form.Item>
      <Form.Item name="coachId" label="Huấn luyện viên" rules={REQUIRED_RULE}>
        <Select options={toOptions(coaches)} virtual={false} />
      </Form.Item>
      <Form.Item
        name="capacity"
        label="Sức chứa"
        rules={[{ required: true, type: 'integer', min: 1 }]}
      >
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái" rules={REQUIRED_RULE}>
        <Select
          options={[CLASS_STATUS.OPEN, CLASS_STATUS.CLOSED].map((value) => ({
            value,
            label: CLASS_STATUS_LABELS[value],
          }))}
        />
      </Form.Item>
      <Form.Item name="description" label="Mô tả">
        <Input.TextArea maxLength={1000} />
      </Form.Item>
    </>
  );
}
