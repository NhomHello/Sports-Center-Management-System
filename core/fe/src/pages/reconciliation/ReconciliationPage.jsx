import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Select, Table, Tag } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useTableQuery } from '@/hooks/useTableQuery';
import { CASE_REASON_LABELS, CASE_STATUS_LABELS } from '@/constants/reconciliation';
import { listCases } from '@/services/reconciliation.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { CaseDrawer } from './CaseDrawer';
import { SepaySyncButton } from './SepaySyncButton';

const options = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const STATUS_COLORS = Object.freeze({
  OPEN: 'gold',
  WAITING_MEMBER: 'blue',
  WAITING_TOPUP: 'orange',
  REFUND_PENDING: 'purple',
  MATCHED: 'green',
  REFUNDED: 'default',
  REJECTED: 'red',
  IGNORED: 'default',
});

function QueueToolbar({ table, query }) {
  return (
    <div className="scms-invoice-toolbar">
      <div className="scms-invoice-toolbar__primary">
        <Select
          aria-label="Lý do đối soát"
          placeholder="Tất cả lý do"
          allowClear
          className="scms-reconcile-filter"
          options={options(CASE_REASON_LABELS)}
          onChange={(reason) => table.setFilters({ reason })}
        />
        <Select
          aria-label="Trạng thái phiếu"
          placeholder="Đang xử lý (kể cả chờ hoàn tiền)"
          allowClear
          className="scms-reconcile-filter"
          options={options(CASE_STATUS_LABELS)}
          onChange={(status) => table.setFilters({ status })}
        />
        <Checkbox onChange={(e) => table.setFilters({ overdue: e.target.checked || undefined })}>
          Chỉ phiếu quá hạn nhắc lại
        </Checkbox>
      </div>
      <div className="scms-invoice-toolbar__primary scms-reconcile-actions">
        <SepaySyncButton />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => query.refetch()}
          loading={query.isFetching}
        >
          Làm mới
        </Button>
      </div>
    </div>
  );
}
/** S29: hàng chờ đối soát chung, bộ lọc và phân trang lấy từ API. */
export default function ReconciliationPage() {
  const table = useTableQuery();
  const [id, setId] = useState(null);
  const query = useQuery({
    queryKey: ['reconciliation', 'list', table.params],
    queryFn: () => listCases(table.params),
  });
  const columns = [
    { title: 'Mã phiếu', dataIndex: 'id' },
    {
      title: 'Hội viên',
      dataIndex: ['member', 'fullName'],
      render: (value) => value ?? <Tag>Chưa xác định</Tag>,
    },
    { title: 'Hóa đơn', dataIndex: ['invoice', 'code'], render: (value) => value ?? '—' },
    { title: 'Lý do', dataIndex: 'reason', render: (value) => CASE_REASON_LABELS[value] ?? value },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (value) => <Tag color={STATUS_COLORS[value]}>{CASE_STATUS_LABELS[value]}</Tag>,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    { title: 'Ngày nhận', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
    {
      title: 'Thao tác',
      render: (_, row) => <Button onClick={() => setId(row.id)}>Xem phiếu</Button>,
    },
  ];
  return (
    <>
      <PageHeader
        title="Hàng chờ đối soát"
        subtitle="Đối chiếu giao dịch và ghi nhận quyết định xử lý."
      />
      <Card variant="borderless" className="scms-workspace-card">
        <QueueToolbar table={table} query={query} />
        {query.isError && <Alert type="error" showIcon title={query.error.message} />}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isPending}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: true }}
        />
      </Card>
      <CaseDrawer id={id} onClose={() => setId(null)} />
    </>
  );
}
