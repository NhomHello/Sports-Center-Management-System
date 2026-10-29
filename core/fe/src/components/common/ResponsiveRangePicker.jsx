import { DatePicker } from 'antd';
import './responsiveRangePicker.css';

/** Hai tháng xếp dọc trên màn hình hẹp để popup không bị cắt ngoài viewport. */
export function ResponsiveRangePicker(props) {
  return <DatePicker.RangePicker {...props} classNames={{ popup: { root: 'scms-range-popup' } }} />;
}
