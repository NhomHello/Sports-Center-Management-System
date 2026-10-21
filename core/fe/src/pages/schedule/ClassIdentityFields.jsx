import { Form, Input, InputNumber, Select } from 'antd';
import { CLASS_STATUS, SCHEDULE_STATUS_LABELS } from '@/constants/schedule';
const required = [{ required: true, message: 'Vui lòng nhập thông tin' }];
const options = (items) =>
  items.map((item) => ({ value: item.id, label: item.name || item.fullName }));
/** Phòng có loại phòng dạy bộ môn đã chọn; HLV có chuyên môn bộ môn đó (góp ý GV). */
const forSubject = ({ rooms, coaches }, subjectId) => ({
  rooms: rooms.filter((r) => r.roomType?.subjects.some((s) => s.subjectId === subjectId)),
  coaches: coaches.filter((c) => c.subjectIds?.includes(subjectId)),
});

/** Thông tin lớp và tài nguyên từ API. */
export function ClassIdentityFields({ subjects, rooms, coaches }) {
  const form = Form.useFormInstance();
  const subjectId = Form.useWatch('subjectId', form);
  const allowed = forSubject({ rooms, coaches }, subjectId);
  const resetInvalid = (nextSubject) => {
    const next = forSubject({ rooms, coaches }, nextSubject);
    const { roomId, coachId } = form.getFieldsValue(['roomId', 'coachId']);
    form.setFieldsValue({
      roomId: next.rooms.some((r) => r.id === roomId) ? roomId : undefined,
      coachId: next.coaches.some((c) => c.id === coachId) ? coachId : undefined,
    });
  };
  const hint = subjectId ? undefined : 'Chọn bộ môn trước';
  return (
    <>
      <Form.Item name="name" label="Tên lớp" rules={required}>
        <Input maxLength={120} />
      </Form.Item>
      <Form.Item name="subjectId" label="Bộ môn" rules={required}>
        <Select options={options(subjects)} virtual={false} onChange={resetInvalid} />
      </Form.Item>
      <Form.Item
        name="roomId"
        label="Phòng tập"
        rules={required}
        extra={hint ?? `${allowed.rooms.length} phòng có loại phòng dạy bộ môn này`}
      >
        <Select
          disabled={!subjectId}
          options={allowed.rooms.map((room) => ({
            value: room.id,
            label: `${room.name} · ${room.roomType.name} · tối đa ${room.capacity} người`,
          }))}
          virtual={false}
        />
      </Form.Item>
      <Form.Item
        name="coachId"
        label="Huấn luyện viên"
        rules={required}
        extra={hint ?? `${allowed.coaches.length} HLV có chuyên môn bộ môn này`}
      >
        <Select disabled={!subjectId} options={options(allowed.coaches)} virtual={false} />
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
