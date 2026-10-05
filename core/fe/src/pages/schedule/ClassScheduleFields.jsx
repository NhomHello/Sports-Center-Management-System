import { Button, DatePicker, Form, Input, Select, Space, Typography } from 'antd';
import { WEEKDAYS } from '@/constants/schedule';
const required = [{ required: true, message: 'Vui lòng chọn thời gian' }];
const timeRules = [{ required: true, pattern: /^([01]\d|2[0-3]):[0-5]\d$/, message: 'Nhập HH:mm' }];
/** Lịch lặp theo giờ Việt Nam, có thể thêm/xoá thứ học. */
export function ClassScheduleFields() {
  return (
    <>
      <Typography.Paragraph type="secondary">
        Các mốc ngày và giờ dưới đây theo giờ Việt Nam.
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
                  <Select options={WEEKDAYS} style={{ minWidth: 120 }} />
                </Form.Item>
                <Form.Item name={[field.name, 'startTime']} label="Giờ bắt đầu" rules={timeRules}>
                  <Input placeholder="18:00" />
                </Form.Item>
                <Form.Item name={[field.name, 'endTime']} label="Giờ kết thúc" rules={timeRules}>
                  <Input placeholder="19:00" />
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
