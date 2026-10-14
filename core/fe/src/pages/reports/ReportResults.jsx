import { Alert, Button, Select, Space, Statistic, Table } from 'antd';
import { formatCurrency } from '@/utils/format';
/** Chỉ số và hàng doanh thu dùng cùng dữ liệu server. */
export function ReportResults({ report, format, setFormat, download }) {
  return (
    <Space vertical className="scms-full-width">
      <Alert
        type="info"
        title={`${report.filters.from} → ${report.filters.to} · ${report.timeZone}`}
      />
      <Space wrap>
        <Statistic title="Doanh thu" value={report.revenue} formatter={formatCurrency} />
        <Statistic title="Đã hoàn" value={report.refunded} formatter={formatCurrency} />
        <Statistic title="Thực thu" value={report.net} formatter={formatCurrency} />
      </Space>
      <Space wrap>
        <Statistic title="Giao dịch" value={report.payment.count} />
        <Statistic
          title="Tiền thực nhận"
          value={report.payment.receivedAmount}
          formatter={formatCurrency}
        />
        <Statistic title="Gói trong kỳ" value={report.membership.total} />
        <Statistic title="Gói hoạt động" value={report.membership.active} />
        <Statistic title="Gói hết hạn" value={report.membership.expired} />
        <Statistic title="Lớp" value={report.classes.total} />
        <Statistic title="Buổi học" value={report.classes.sessions} />
        <Statistic title="Buổi hủy" value={report.classes.cancelledSessions} />
        <Statistic title="Đăng ký" value={report.classes.enrollments} />
      </Space>
      <Space>
        <Select
          aria-label="Định dạng báo cáo"
          value={format}
          onChange={setFormat}
          options={['csv', 'xlsx', 'pdf'].map((v) => ({ value: v, label: v.toUpperCase() }))}
        />
        <Button loading={download.isPending} onClick={() => download.mutate()}>
          Xuất báo cáo
        </Button>
      </Space>
      <Table
        rowKey="date"
        dataSource={report.rows}
        scroll={{ x: 600 }}
        pagination={{ hideOnSinglePage: true }}
        columns={[
          { title: 'Ngày', dataIndex: 'date' },
          ...[
            ['revenue', 'Doanh thu'],
            ['refunded', 'Hoàn tiền'],
            ['net', 'Thực thu'],
          ].map(([dataIndex, title]) => ({
            title,
            dataIndex,
            render: (v) => formatCurrency(v),
          })),
          { title: 'Hóa đơn đã trả', dataIndex: 'paidCount' },
          { title: 'Lượt hoàn', dataIndex: 'refundCount' },
        ]}
      />
    </Space>
  );
}
