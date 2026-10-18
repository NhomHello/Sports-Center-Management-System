import { Link } from 'react-router';
import { Button, Empty, Table, Tag, Typography } from 'antd';
import { ROUTES, INVOICE_CHANNEL, INVOICE_STATUS } from '@/constants';
import { formatCurrency, formatDate } from '@/utils/format';
import { invoiceReceived, invoiceStatusMeta } from '@/utils/invoice';
import { InvoiceActions } from './InvoiceActions';

/** Dòng phụ dưới số tiền: còn thiếu, tiền đã nhận của hoá đơn bị huỷ, hoặc phần chuyển thừa. */
const amountNote = (invoice, received) => {
  const money = (value) => formatCurrency(value, invoice.currency);
  if (received <= 0) return null;
  if (invoice.status === INVOICE_STATUS.PENDING)
    return {
      type: 'warning',
      text: `Đã nhận ${money(received)} · thiếu ${money(invoice.amount - received)}`,
    };
  if (invoice.status === INVOICE_STATUS.FAILED)
    return { type: 'danger', text: `Đã nhận ${money(received)} · chờ hoàn trả` };
  if (invoice.status === INVOICE_STATUS.PAID && received > invoice.amount)
    return { type: 'warning', text: `Chuyển thừa ${money(received - invoice.amount)}` };
  return null;
};

/** Số tiền kèm trạng thái tiền đã nhận (UC-PAY-08). */
function AmountCell({ invoice }) {
  const note = amountNote(invoice, invoiceReceived(invoice));
  return (
    <div className="scms-invoice-amount">
      <strong>{formatCurrency(invoice.amount, invoice.currency)}</strong>
      {note && <Typography.Text type={note.type}>{note.text}</Typography.Text>}
    </div>
  );
}

const buildColumns = ({ showMember, onCash, onDetail }) =>
  [
    { title: 'Mã hóa đơn', dataIndex: 'code', key: 'code', width: 120 },
    showMember && {
      title: 'Hội viên',
      dataIndex: ['user', 'fullName'],
      key: 'member',
      ellipsis: true,
    },
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
          <Tag color="blue">Chuyển khoản</Tag>
        ),
    },
    {
      title: 'Số tiền',
      key: 'amount',
      align: 'right',
      render: (_, invoice) => <AmountCell invoice={invoice} />,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'created',
      render: (date) => formatDate(date),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, invoice) => {
        const meta = invoiceStatusMeta(invoice);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, invoice) => (
        <InvoiceActions invoice={invoice} onCash={onCash} onDetail={onDetail} />
      ),
    },
  ].filter(Boolean);

/** Hóa đơn của chính hội viên hoặc các hóa đơn trong phạm vi quyền được cấp. */
export function InvoiceTable({
  invoices,
  loading,
  pagination,
  onChange,
  onCash,
  onDetail,
  showMember = true,
}) {
  return (
    <Table
      rowKey="id"
      columns={buildColumns({ showMember, onCash, onDetail })}
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
