import { EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Button, Space, Table } from 'antd';
import { INVOICE_CHANNEL, INVOICE_STATUS_META } from '@/constants';
import { canCollectCash } from '@/utils/invoice';
import { usePermission } from '@/hooks/usePermission';
import { formatCurrency, formatDate } from '@/utils/format';
import { StatusTag } from '@/components/common/StatusTag';

/** Hoá đơn của chính hội viên hoặc các hoá đơn trong phạm vi quyền được cấp. */
export function InvoiceTable({ invoices, loading, pagination, onChange, onCash, onDetail }) {
  const { can } = usePermission();
  const columns = [
    { title: 'Mã hoá đơn', dataIndex: 'code', key: 'code' },
    { title: 'Hội viên', dataIndex: ['user', 'fullName'], key: 'member' },
    {
      title: 'Gói tập',
      key: 'plan',
      render: (_, invoice) => invoice.planName ?? invoice.plan?.name ?? '—',
    },
    {
      title: 'Kênh',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel) => (channel === INVOICE_CHANNEL.COUNTER ? 'Tại quầy' : 'Online'),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, invoice) => formatCurrency(amount, invoice.currency),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'created',
      render: (date) => formatDate(date),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag value={status} meta={INVOICE_STATUS_META} />,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, invoice) => (
        <Space wrap>
          {canCollectCash({ invoice, canRecordCash: can(PERMISSIONS.PAYMENT_RECORD_CASH) }) && (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => onCash(invoice.id)}
            >
              Thu tiền
            </Button>
          )}
          <Button size="small" icon={<EyeOutlined />} onClick={() => onDetail(invoice.id)}>
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={invoices}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
      scroll={{ x: true }}
      locale={{ emptyText: 'Chưa có hoá đơn nào.' }}
    />
  );
}
