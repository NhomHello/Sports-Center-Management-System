import { Button, DatePicker, Segmented, Space, Switch, Typography } from 'antd';
/** Điều hướng ngày/tuần không gắn cố định một tuần demo. */
export function ScheduleToolbar({ calendar }) {
  return (
    <Space wrap>
      <Button onClick={() => calendar.move(-1)}>Trước</Button>
      <DatePicker value={calendar.date} allowClear={false} onChange={calendar.setDate} />
      <Button onClick={() => calendar.move(1)}>Sau</Button>
      <Segmented
        value={calendar.mode}
        onChange={calendar.setMode}
        options={[
          { value: 'day', label: 'Ngày' },
          { value: 'week', label: 'Tuần' },
        ]}
      />
      <Space>
        <Switch checked={calendar.showCancelled} onChange={calendar.setShowCancelled} />
        <Typography.Text>Hiện lịch đã huỷ</Typography.Text>
      </Space>
    </Space>
  );
}
