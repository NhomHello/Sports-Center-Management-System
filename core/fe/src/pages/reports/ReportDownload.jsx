import { Button, Select, Space } from 'antd';
/** File xuất luôn dùng bộ lọc đã áp dụng của tab hiện tại. */
export function ReportDownload({ format, setFormat, download }) {
  return <Space wrap>
    <Select aria-label="Định dạng báo cáo" value={format} onChange={setFormat}
      options={['csv', 'xlsx', 'pdf'].map((value) => ({ value, label: value.toUpperCase() }))} />
    <Button loading={download.isPending} onClick={() => download.mutate()}>Xuất báo cáo</Button>
  </Space>;
}
