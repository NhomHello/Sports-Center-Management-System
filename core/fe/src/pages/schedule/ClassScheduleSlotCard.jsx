import { useState } from 'react';
import { Alert, Button, Card, Form, Select, TimePicker } from 'antd';
import { WEEKDAYS } from '@/constants/schedule';

const TIME_FORMAT = 'HH:mm';
const required = [{ required: true, message: 'Vui lòng chọn đầy đủ thông tin' }];

function containsRange(frame, range) {
  if (!frame || !range?.[0] || !range?.[1]) return false;

  const start = range[0].format(TIME_FORMAT);
  const end = range[1].format(TIME_FORMAT);

  return start < end && frame.startTime <= start && end <= frame.endTime;
}

function validateRange(frame, range) {
  if (!frame) {
    return Promise.reject(new Error('Vui lòng chọn khung giờ đang hoạt động'));
  }

  if (!range?.[0] || !range?.[1]) {
    return Promise.reject(new Error('Vui lòng chọn đủ giờ học'));
  }

  const start = range[0].format(TIME_FORMAT);
  const end = range[1].format(TIME_FORMAT);

  if (start >= end) {
    return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu, không qua đêm'));
  }

  if (!containsRange(frame, range)) {
    return Promise.reject(new Error(`Giờ học phải nằm trong ${frame.startTime}–${frame.endTime}`));
  }

  return Promise.resolve();
}

function useSlotFrame(form, field, frames) {
  const rangePath = ['weeklySchedule', field.name, 'timeRange'];

  // Lớp cũ chưa lưu ID khung giờ: suy ra từ khoảng giờ hiện có.
  const [selectedId, setSelectedId] = useState(() => {
    const range = form.getFieldValue(rangePath);
    return frames.find((frame) => containsRange(frame, range))?.id;
  });

  // Danh mục tải bất đồng bộ: khôi phục khung phù hợp cho lớp cũ khi danh mục vừa về.
  const selectedFrame =
    frames.find((frame) => frame.id === selectedId) ??
    frames.find((frame) => containsRange(frame, form.getFieldValue(rangePath)));

  const changeFrame = (id) => {
    setSelectedId(id);

    const nextFrame = frames.find((frame) => frame.id === id);
    const range = form.getFieldValue(rangePath);

    // Không giữ giờ cũ nếu vượt giới hạn của khung vừa chọn.
    if (!containsRange(nextFrame, range)) {
      form.setFieldValue(rangePath, undefined);
    }

    form.setFields([{ name: rangePath, errors: [] }]);
  };

  return { selectedFrame, changeFrame };
}

/** Thẻ nhập một buổi học trong khung giờ hoạt động từ database. */
export function ClassScheduleSlotCard({ field, index, frames, onRemove }) {
  const form = Form.useFormInstance();
  const { selectedFrame, changeFrame } = useSlotFrame(form, field, frames);

  return (
    <Card
      size="small"
      title={`Buổi học ${index + 1}`}
      style={{ marginBottom: 16 }}
      extra={
        <Button type="text" danger htmlType="button" onClick={() => onRemove(field.name)}>
          Xóa buổi
        </Button>
      }
    >
      <Form.Item name={[field.name, 'dayOfWeek']} label="Thứ" rules={required}>
        <Select options={WEEKDAYS} virtual={false} placeholder="Chọn thứ học" />
      </Form.Item>

      <Form.Item label="Khung giờ hoạt động" required>
        <Select
          aria-label="Khung giờ hoạt động"
          value={selectedFrame?.id}
          onChange={changeFrame}
          placeholder="Chọn khung giờ"
          disabled={!frames.length}
          options={frames.map((frame) => ({
            value: frame.id,
            label: `${frame.name} (${frame.startTime}–${frame.endTime})`,
          }))}
        />
      </Form.Item>

      {selectedFrame && (
        <Alert
          showIcon
          type="info"
          title={`Giờ học trong khoảng ${selectedFrame.startTime}–${selectedFrame.endTime}`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item
        name={[field.name, 'timeRange']}
        label="Giờ học"
        rules={[
          {
            validator: (_, range) => validateRange(selectedFrame, range),
          },
        ]}
      >
        <TimePicker.RangePicker
          format={TIME_FORMAT}
          order={false}
          disabled={!selectedFrame}
          allowEmpty={!selectedFrame ? [true, true] : [false, false]}
          placeholder={['Bắt đầu', 'Kết thúc']}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Card>
  );
}
