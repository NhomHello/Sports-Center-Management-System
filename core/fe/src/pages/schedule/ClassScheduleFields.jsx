import { Button, DatePicker, Form, TimePicker, Select, Space, Typography } from 'antd';
import { WEEKDAYS } from '@/constants/schedule';
const required = [{ required: true, message: 'Vui lòng chọn thời gian' }];
/** Lịch lặp theo giờ Việt Nam, có thể thêm/xóa thứ học. */
export function ClassScheduleFields({ frames = [] }) {
  const active = frames.filter((f) => f.isActive);
  return (
    <>
      <Typography.Paragraph type="secondary">
        Các mốc ngày và giờ dưới đây theo giờ Việt Nam. Mỗi khung giờ học phải nằm trọn trong một
        khung giờ hoạt động:{' '}
        {active.map((f) => `${f.name} ${f.startTime}–${f.endTime}`).join(' · ') || 'chưa cấu hình'}.
      </Typography.Paragraph>
      <Form.Item name="startsOn" label="Ngày bắt đầu" rules={required}>
        <DatePicker />
      </Form.Item>
      <Form.Item name="endsOn" label="Ngày kết thúc" rules={required}>
        <DatePicker />
      </Form.Item>
      <Form.Item name="registrationStartAt" label="Mở đăng ký lúc" rules={required}>
        <DatePicker showTime />
      </Form.Item>
      <Form.Item name="registrationEndAt" label="Đóng đăng ký lúc" rules={required}>
        <DatePicker showTime />
      </Form.Item>
      <Form.List
        name="weeklySchedule"
        rules={[
          {
            validator: (_, value) =>
              value?.length
                ? Promise.resolve()
                : Promise.reject(new Error('Cần ít nhất một buổi trong tuần')),
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map((field) => (
              <Space key={field.key} wrap align="start">
                <Form.Item name={[field.name, 'dayOfWeek']} label="Thứ" rules={required}>
                  <Select options={WEEKDAYS} virtual={false} style={{ minWidth: 120 }} />
                </Form.Item>
                <Form.Item name={[field.name, 'timeRange']} label="Giờ học" rules={required}>
                  <TimePicker.RangePicker format="HH:mm" />
                </Form.Item>
                <Button danger onClick={() => remove(field.name)}>
                  Bỏ buổi
                </Button>
              </Space>
            ))}
            <Form.ErrorList errors={errors} />
            <Button onClick={() => add({})}>Thêm thứ học</Button>
          </>
        )}
      </Form.List>
    </>
  );
}
