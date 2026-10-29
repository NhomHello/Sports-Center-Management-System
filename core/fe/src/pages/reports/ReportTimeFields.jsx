import { Checkbox, DatePicker, Form, Select } from 'antd';
import { DATE_FORMATS } from '@/constants';
import { REPORT_GROUPS, REPORT_PRESETS } from '@/constants/reports';
import { reportPreset } from '@/utils/reportFilters';
/** Nhóm kỳ và khoảng nhanh thay đổi form nháp; chỉ nút Áp dụng mới đổi dữ liệu. */
export function ReportTimeFields({ form, today }) {
  return <>
    <Form.Item label="Khoảng nhanh">
      <Select aria-label="Khoảng nhanh" defaultValue="month" options={REPORT_PRESETS} style={{ minWidth: 145 }}
        onChange={(value) => { const preset = reportPreset(value, today); if (preset) form.setFieldsValue(preset); }} />
    </Form.Item>
    <Form.Item name="range" label="Khoảng ngày" rules={[{ required: true }]}>
      <DatePicker.RangePicker format={DATE_FORMATS.DATE} allowClear={false} />
    </Form.Item>
    <Form.Item name="groupBy" label="Nhóm theo"><Select aria-label="Nhóm thời gian" options={REPORT_GROUPS} style={{ minWidth: 110 }} /></Form.Item>
    <Form.Item name="compare" valuePropName="checked"><Checkbox>So sánh kỳ trước</Checkbox></Form.Item>
  </>;
}
