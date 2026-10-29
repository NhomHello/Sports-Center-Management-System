import { Alert, Button, Card, Select, Space, Statistic, Table } from 'antd';
import { formatCurrency } from '@/utils/format';
/** Một nhóm chỉ số cùng chủ đề; lưới đều cột để các con số không dồn sát nhau. */
function StatGroup({ title, items }) {
  return (
    <Card size="small" title={title} className="scms-report-group">
      <div className="scms-report-stats">
        {items.map(([label, value, money]) => (
          <Statistic
            key={label}
            title={label}
            value={value}
            formatter={money ? formatCurrency : undefined}
          />
        ))}
      </div>
    </Card>
  );
}

/** Chỉ số và hàng doanh thu dùng cùng dữ liệu server. */
export function ReportResults({ report, format, setFormat, download }) {
  return (
    <Space vertical className="scms-full-width">
      <Alert
        type="info"
        title={`${report.filters.from} → ${report.filters.to} · ${report.timeZone}`}
      />
      <div className="scms-report-groups">
        <StatGroup
          title="Tài chính"
          items={[
            ['Doanh thu', report.revenue, true],
            ['Đã hoàn', report.refunded, true],
            ['Thực thu', report.net, true],
            ['Giao dịch', report.payment.count],
            ['Tiền thực nhận', report.payment.receivedAmount, true],
          ]}
        />
        <StatGroup
          title="Gói tập"
          items={[
            ['Gói trong kỳ', report.membership.total],
            ['Gói hoạt động', report.membership.active],
            ['Gói hết hạn', report.membership.expired],
          ]}
        />
        <StatGroup
          title="Lớp học"
          items={[
            ['Lớp', report.classes.total],
            ['Buổi học', report.classes.sessions],
            ['Buổi hủy', report.classes.cancelledSessions],
            ['Đăng ký', report.classes.enrollments],
          ]}
        />
      </div>
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
