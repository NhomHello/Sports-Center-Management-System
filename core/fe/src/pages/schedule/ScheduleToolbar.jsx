import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Segmented, Switch } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { vietnamInput } from '@/utils/schedule';
/** Điều hướng ngày/tuần không gắn cố định một tuần demo. */
export function ScheduleToolbar({ calendar }) {
  return (
    <div className="scms-calendar-toolbar">
      <div className="scms-calendar-navigation">
        <Button aria-label="Trước" icon={<LeftOutlined />} onClick={() => calendar.move(-1)}>
          Trước
        </Button>
        <DatePicker
          aria-label="Ngày xem lịch"
          format={DATE_FORMATS.DATE}
          value={calendar.date}
          allowClear={false}
          onChange={calendar.setDate}
        />
        <Button
          aria-label="Sau"
          icon={<RightOutlined />}
          iconPlacement="end"
          onClick={() => calendar.move(1)}
        >
          Sau
        </Button>
        <Button
          className="scms-calendar-today"
          onClick={() => calendar.setDate(vietnamInput(new Date()))}
        >
          Hôm nay
        </Button>
      </div>
      <div className="scms-calendar-options">
        <Segmented
          aria-label="Chế độ xem lịch"
          value={calendar.mode}
          onChange={calendar.setMode}
          options={[
            { value: 'day', label: 'Ngày' },
            { value: 'week', label: 'Tuần' },
          ]}
        />
        <label className="scms-calendar-cancelled-toggle">
          <Switch
            aria-label="Hiện lịch đã huỷ"
            checked={calendar.showCancelled}
            onChange={calendar.setShowCancelled}
          />
          <span>Hiện lịch đã huỷ</span>
        </label>
      </div>
    </div>
  );
}
