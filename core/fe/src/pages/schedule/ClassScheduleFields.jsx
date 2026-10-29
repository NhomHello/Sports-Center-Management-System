import { Alert, Button, DatePicker, Form, Typography } from 'antd';
import { ClassScheduleSlotCard } from './ClassScheduleSlotCard';

const required = [{ required: true, message: 'Vui lòng chọn thời gian' }];

function toCompleteSlot(slot, index) {
  if (!Number.isInteger(slot?.dayOfWeek)) return null;
  if (!slot.timeRange?.[0] || !slot.timeRange?.[1]) return null;

  return {
    index,
    dayOfWeek: slot.dayOfWeek,
    start: slot.timeRange[0].format('HH:mm'),
    end: slot.timeRange[1].format('HH:mm'),
  };
}

function slotsOverlap(first, second) {
  return (
    first.dayOfWeek === second.dayOfWeek && first.start < second.end && second.start < first.end
  );
}

function findScheduleConflict(slots) {
  const complete = slots.map(toCompleteSlot).filter(Boolean);

  for (let i = 0; i < complete.length; i += 1) {
    const first = complete[i];
    const second = complete.slice(i + 1).find((slot) => slotsOverlap(first, slot));

    if (second) return [first.index + 1, second.index + 1];
  }

  return null;
}

function validateWeeklySchedule(_, slots) {
  if (!slots?.length) {
    return Promise.reject(new Error('Cần ít nhất một buổi học trong tuần'));
  }

  const conflict = findScheduleConflict(slots);

  if (conflict) {
    return Promise.reject(new Error(`Buổi ${conflict[0]} và buổi ${conflict[1]} bị trùng giờ`));
  }

  return Promise.resolve();
}

/** Cấu hình ngày, đăng ký và các buổi học theo giờ Việt Nam. */
export function ClassScheduleFields({ frames = [] }) {
  const activeFrames = frames
    .filter((frame) => frame.isActive)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <Typography.Paragraph type="secondary">
        Tất cả ngày và giờ theo giờ Việt Nam (UTC+7). Mỗi buổi học phải nằm trọn trong một khung giờ
        hoạt động.
      </Typography.Paragraph>

      <Form.Item name="startsOn" label="Ngày bắt đầu" rules={required}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="endsOn" label="Ngày kết thúc" rules={required}>
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="registrationStartAt" label="Mở đăng ký lúc" rules={required}>
        <DatePicker showTime style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="registrationEndAt" label="Đóng đăng ký lúc" rules={required}>
        <DatePicker showTime style={{ width: '100%' }} />
      </Form.Item>

      {!activeFrames.length && (
        <Alert
          showIcon
          type="warning"
          title="Chưa có khung giờ hoạt động"
          description="Hãy cấu hình trong tab Khung giờ trước khi tạo lịch học."
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.List name="weeklySchedule" rules={[{ validator: validateWeeklySchedule }]}>
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map((field, index) => (
              <ClassScheduleSlotCard
                key={field.key}
                field={field}
                index={index}
                frames={activeFrames}
                onRemove={remove}
              />
            ))}

            <Form.ErrorList errors={errors} />

            <Button
              block
              type="dashed"
              htmlType="button"
              disabled={!activeFrames.length}
              onClick={() => add({})}
            >
              Thêm buổi học
            </Button>
          </>
        )}
      </Form.List>
    </>
  );
}
