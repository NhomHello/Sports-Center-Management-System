import { DatePicker, Form, Input, InputNumber, Select, Switch } from 'antd';
import { PROFILE_LEVELS, PROFILE_GENDERS } from '@/constants/profile';
import { DATE_FORMATS } from '@/constants';

/** Nhóm dữ liệu tự nguyện; tắt chia sẻ sẽ được ẩn tại API dành cho HLV. */
export function MemberTrainingFields() {
  return (
    <>
      <Form.Item name="birthDate" label="Ngày sinh">
        <DatePicker format={DATE_FORMATS.DATE} />
      </Form.Item>
      <Form.Item name="gender" label="Giới tính">
        <Select allowClear options={PROFILE_GENDERS} />
      </Form.Item>
      <Form.Item name="heightCm" label="Chiều cao (cm)">
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item name="weightKg" label="Cân nặng (kg)">
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item name="goals" label="Mục tiêu tập luyện">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="level" label="Trình độ">
        <Select options={PROFILE_LEVELS} />
      </Form.Item>
      <Form.Item name="healthNotes" label="Ghi chú sức khoẻ / chấn thương">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="emergencyName" label="Tên người liên hệ khẩn cấp">
        <Input />
      </Form.Item>
      <Form.Item name="emergencyPhone" label="Số điện thoại khẩn cấp">
        <Input />
      </Form.Item>
      <Form.Item
        name="shareWithCoach"
        valuePropName="checked"
        label="Chia sẻ mục tiêu và sức khoẻ với HLV"
        extra="Chỉ HLV trong phạm vi lớp được phân công mới xem thông tin chia sẻ."
      >
        <Switch />
      </Form.Item>
    </>
  );
}
