import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Alert, Card, Table } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listPayments } from '@/services/payment.service';
import { INVOICE_STATUS_META, PAYMENT_PROVIDER_LABELS } from '@/constants';
import { StatusTag } from '@/components/common/StatusTag';
import { formatCurrency, formatDateTime } from '@/utils/format';

const columns = [
  { title: 'Hóa đơn', dataIndex: ['invoice', 'code'] },
  {
    title: 'Trạng thái hóa đơn',
    dataIndex: ['invoice', 'status'],
    render: (status) => <StatusTag value={status} meta={INVOICE_STATUS_META} />,
  },
  { title: 'Hội viên', dataIndex: ['invoice', 'user', 'fullName'] },
  {
    title: 'Kênh',
    dataIndex: 'provider',
    render: (value) => PAYMENT_PROVIDER_LABELS[value] ?? value,
  },
  {
    title: 'Thực nhận',
    dataIndex: 'receivedAmount',
    align: 'right',
    render: (value) => formatCurrency(value),
  },
  { title: 'Tham chiếu', dataIndex: 'reference' },
  { title: 'Thời điểm', dataIndex: 'paidAt', render: (value) => formatDateTime(value) },
];
/** Lịch sử từng lần chuyển, bao gồm chuyển bù và các hóa đơn đã hoàn. */
export function PaymentHistoryPanel() {
  const { can } = usePermission();
  const { user } = useAuth();
  const canReadAll = can(PERMISSIONS.PAYMENT_READ_ALL);
  const table = useTableQuery();
  const enabled = can(PERMISSIONS.PAYMENT_READ_ALL, PERMISSIONS.PAYMENT_READ_OWN);
  const query = useQuery({
    queryKey: ['payments', user?.id, canReadAll, table.params],
    queryFn: () => listPayments(table.params, !canReadAll),
    enabled,
  });
  if (!enabled) return null;
  return (
    <Card title="Lịch sử giao dịch">
      {query.isError && <Alert type="error" title={query.error.message} />}
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
  );
}
