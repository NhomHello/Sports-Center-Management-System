import { Link } from 'react-router';
import { InvoiceActions } from './InvoiceActions';
import { EyeOutlined, DollarOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Button, Space, Table, Tag, Tooltip, Empty } from 'antd';
import { ROUTES, INVOICE_CHANNEL, INVOICE_STATUS, INVOICE_STATUS_META } from '@/constants';
import { formatCurrency, formatDate } from '@/utils/format';
import { StatusTag } from '@/components/common/StatusTag';

/** Hóa đơn của chính hội viên hoặc các hóa đơn trong phạm vi quyền được cấp. */
export function InvoiceTable({ invoices, loading, pagination, onChange, onCash, onDetail }) {
  const columns = [
    { title: 'Mã hóa đơn', dataIndex: 'code', key: 'code' },
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
      render: (channel) =>
        channel === INVOICE_CHANNEL.COUNTER ? (
          <Tag color="purple">Tại quầy</Tag>
        ) : (
          <Tag color="blue">Trực tuyến</Tag>
        ),
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
        <InvoiceActions invoice={invoice} onCash={onCash} onDetail={onDetail} />
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
      locale={{
        emptyText: (
          <Empty description="Chưa có hóa đơn nào.">
            <Link to={ROUTES.MEMBERSHIP_PLANS}>
              <Button>Xem gói tập</Button>
            </Link>
          </Empty>
        ),
      }}
    />
  );
}
