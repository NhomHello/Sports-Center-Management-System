import { Form, Input, InputNumber, Select } from 'antd';
import { CLASS_STATUS, SCHEDULE_STATUS_LABELS } from '@/constants/schedule';

const required = [{ required: true, message: 'Vui lòng nhập thông tin' }];
const options = (items) =>
  items.map((item) => ({ value: item.id, label: item.name || item.fullName }));

/** Phòng và HLV hợp lệ theo bộ môn đang chọn. */
const forSubject = ({ rooms, coaches }, subjectId) => ({
  rooms: rooms.filter((room) =>
    room.roomType?.subjects?.some((subject) => subject.subjectId === subjectId),
  ),
  coaches: coaches.filter((coach) => coach.subjectIds?.includes(subjectId)),
});

function SubjectResourceFields({ subjects, rooms, coaches }) {
  const form = Form.useFormInstance();
  const subjectId = Form.useWatch('subjectId', form);
  const allowed = forSubject({ rooms, coaches }, subjectId);
  const resetInvalid = (nextSubject) => {
    const next = forSubject({ rooms, coaches }, nextSubject);
    const { roomId, coachId } = form.getFieldsValue(['roomId', 'coachId']);
    form.setFieldsValue({
      roomId: next.rooms.some((room) => room.id === roomId) ? roomId : undefined,
      coachId: next.coaches.some((coach) => coach.id === coachId) ? coachId : undefined,
    });
  };
  const hint = subjectId ? undefined : 'Chọn bộ môn trước';
  return (
    <>
      <Form.Item name="name" label="Tên lớp" rules={required}>
        <Input maxLength={120} placeholder="Ví dụ: Yoga buổi sáng" />
      </Form.Item>
      <Form.Item name="subjectId" label="Bộ môn" rules={required}>
        <Select
          options={options(subjects)}
          virtual={false}
          onChange={resetInvalid}
          placeholder="Chọn bộ môn"
        />
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
            label: `${room.name} · ${room.roomType?.name ?? 'Phòng tập'} · tối đa ${room.capacity} người`,
          }))}
          virtual={false}
          placeholder="Chọn phòng tập"
        />
      </Form.Item>
      <Form.Item
        name="coachId"
        label="Huấn luyện viên"
        rules={required}
        extra={hint ?? `${allowed.coaches.length} HLV có chuyên môn bộ môn này`}
      >
        <Select
          disabled={!subjectId}
          options={options(allowed.coaches)}
          virtual={false}
          placeholder="Chọn huấn luyện viên"
        />
      </Form.Item>
    </>
  );
}

function ClassCapacityFields() {
  return (
    <>
      <div className="scms-class-capacity-status">
        <Form.Item
          name="capacity"
          label="Sức chứa"
          rules={[{ required: true, type: 'integer', min: 1 }]}
        >
          <InputNumber min={1} />
        </Form.Item>
        <Form.Item
          name="price"
          label="Học phí cả khóa (VNĐ)"
          extra="0 = lớp miễn phí. Đăng ký giữa khóa tính theo số buổi còn lại."
          rules={[{ type: 'integer', min: 0 }]}
        >
          <InputNumber
            min={0}
            step={50000}
            precision={0}
            formatter={(value) => String(value ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(value) => value?.replace(/\./g, '')}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Select
            options={[CLASS_STATUS.OPEN, CLASS_STATUS.CLOSED].map((value) => ({
              value,
              label: SCHEDULE_STATUS_LABELS[value],
            }))}
          />
        </Form.Item>
      </div>
      <Form.Item name="description" label="Mô tả">
        <Input.TextArea
          maxLength={1000}
          rows={3}
          placeholder="Nội dung và lưu ý dành cho hội viên"
        />
      </Form.Item>
    </>
  );
}

/** Thông tin lớp và tài nguyên từ API. */
export function ClassIdentityFields({ subjects = [], rooms = [], coaches = [] }) {
  return (
    <>
      <SubjectResourceFields subjects={subjects} rooms={rooms} coaches={coaches} />
      <ClassCapacityFields />
    </>
  );
}
