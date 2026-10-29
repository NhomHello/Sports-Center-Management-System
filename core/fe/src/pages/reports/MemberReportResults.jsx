import { Card, Space, Table } from 'antd';
import { ReportChart } from './ReportChart';
import { ReportDownload } from './ReportDownload';
const fields = [['newMembers', 'Hội viên mới'], ['activePeriods', 'Kỳ gói hiệu lực'], ['newEnrollments', 'Đăng ký mới'],
  ['cancelledPlans', 'Huỷ gói'], ['cancelledEnrollments', 'Huỷ đăng ký'], ['classCount', 'Lớp'], ['seats', 'Sức chứa'], ['booked', 'Đăng ký trong kỳ']];
/** Chỉ hiển thị số liệu server; cùng nhóm kỳ với tab doanh thu. */
export function MemberReportResults({ report, format, setFormat, download }) {
  return <Space vertical className="scms-full-width">
    <ReportDownload format={format} setFormat={setFormat} download={download} />
    <ReportChart rows={report.rows} members />
    <Card title="Hội viên và tình trạng đăng ký">
      <Table rowKey="date" dataSource={report.rows} scroll={{ x: 1200 }} pagination={{ hideOnSinglePage: true }}
        columns={[{ title: 'Kỳ', dataIndex: 'date', fixed: 'left' }, ...fields.map(([dataIndex, title]) => ({ title, dataIndex })),
          { title: 'Lấp đầy', dataIndex: 'occupancyPercent', render: (value) => `${value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%` }]} />
    </Card>
  </Space>;
}
