import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, TimePicker, Select, Typography } from 'antd';
import { WEEKDAYS } from '@/constants/schedule';
import { DATE_FORMATS } from '@/constants';
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
      <div className="scms-class-date-fields">
        <Form.Item name="startsOn" label="Ngày bắt đầu" rules={required}>
          <DatePicker format={DATE_FORMATS.DATE} />
        </Form.Item>
        <Form.Item name="endsOn" label="Ngày kết thúc" rules={required}>
          <DatePicker format={DATE_FORMATS.DATE} />
        </Form.Item>
        <Form.Item name="registrationStartAt" label="Mở đăng ký lúc" rules={required}>
          <DatePicker showTime format={DATE_FORMATS.DATE_TIME} />
        </Form.Item>
        <Form.Item name="registrationEndAt" label="Đóng đăng ký lúc" rules={required}>
          <DatePicker showTime format={DATE_FORMATS.DATE_TIME} />
        </Form.Item>
      </div>
      <Typography.Title level={5}>Lịch học hằng tuần</Typography.Title>
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
              <div key={field.key} className="scms-class-weekly-row">
                <Form.Item name={[field.name, 'dayOfWeek']} label="Thứ" rules={required}>
                  <Select options={WEEKDAYS} virtual={false} placeholder="Chọn thứ" />
                </Form.Item>
                <Form.Item name={[field.name, 'timeRange']} label="Giờ học" rules={required}>
                  <TimePicker.RangePicker format="HH:mm" placeholder={['Bắt đầu', 'Kết thúc']} />
                </Form.Item>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label={`Bỏ buổi ${field.name + 1}`}
                  onClick={() => remove(field.name)}
                />
              </div>
            ))}
            <Form.ErrorList errors={errors} />
            <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({})}>
              Thêm thứ học
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}
