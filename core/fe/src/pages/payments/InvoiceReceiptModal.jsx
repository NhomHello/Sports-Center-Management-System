/* eslint-disable max-lines -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Descriptions, Empty, Modal, Space, Table, Typography, Tooltip } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { PageLoading } from '@/components/common/PageLoading';
import { StatusTag } from '@/components/common/StatusTag';
import { INVOICE_STATUS, INVOICE_STATUS_META, QUERY_KEYS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import * as paymentService from '@/services/payment.service';
import { getApiAvailabilityNotice, shouldRetryApiQuery } from '@/utils/apiAvailability';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { canCollectCash, canPrintInvoice } from '@/utils/invoice';

const MODAL_WIDTH = 760;

const PAYMENT_COLUMNS = [
  { title: 'Kênh thanh toán', dataIndex: 'provider', key: 'provider' },
  {
    title: 'Số tiền yêu cầu',
    dataIndex: 'requestedAmount',
    key: 'requested',
    render: (amount) => formatCurrency(amount),
  },
  {
    title: 'Số tiền thực nhận',
    dataIndex: 'receivedAmount',
    key: 'received',
    render: (amount) => formatCurrency(amount),
  },
  {
    title: 'Tham chiếu',
    dataIndex: 'reference',
    key: 'reference',
    render: (value) => value || '—',
  },
  {
    title: 'Người thu',
    dataIndex: ['actor', 'fullName'],
    key: 'collector',
    render: (value) => value || '—',
  },
  {
    title: 'Thời điểm',
    dataIndex: 'paidAt',
    key: 'paidAt',
    render: (date) => formatDateTime(date),
  },
];

function CenterBlock({ centerInfo }) {
  if (!centerInfo?.name) return null;
  return (
    <header className="scms-receipt-center">
      <Typography.Title level={3}>{centerInfo.name}</Typography.Title>
      {centerInfo.address && <Typography.Paragraph>{centerInfo.address}</Typography.Paragraph>}
      {centerInfo.phone && (
        <Typography.Paragraph>Điện thoại: {centerInfo.phone}</Typography.Paragraph>
      )}
    </header>
  );
}

function InvoiceSummary({ invoice, receivedAmount }) {
  const planName = invoice.planName ?? invoice.plan?.name ?? invoice.membership?.plan?.name ?? '—';
  return (
    <Descriptions bordered column={1}>
      <Descriptions.Item label="Mã hoá đơn">{invoice.code}</Descriptions.Item>
      <Descriptions.Item label="Hội viên">{invoice.user?.fullName ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Gói tập">{planName}</Descriptions.Item>
      <Descriptions.Item label="Trạng thái">
        <StatusTag value={invoice.status} meta={INVOICE_STATUS_META} />
      </Descriptions.Item>
      <Descriptions.Item label="Số tiền yêu cầu">
        {formatCurrency(invoice.amount, invoice.currency)}
      </Descriptions.Item>
      <Descriptions.Item label="Tổng thực nhận">
        {formatCurrency(receivedAmount, invoice.currency)}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày tạo">{formatDateTime(invoice.createdAt)}</Descriptions.Item>
      <Descriptions.Item label="Ngày thanh toán">
        {formatDateTime(invoice.paidAt)}
      </Descriptions.Item>
    </Descriptions>
  );
}

function PaymentHistory({ payments, currency }) {
  if (payments.length === 0) {
    return (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có giao dịch thanh toán." />
    );
  }
  return (
    <Table
      rowKey="id"
      columns={PAYMENT_COLUMNS.map((column) =>
        ['requestedAmount', 'receivedAmount'].includes(column.dataIndex)
          ? { ...column, render: (amount) => formatCurrency(amount, currency) }
          : column,
      )}
      dataSource={payments}
      pagination={false}
      scroll={{ x: true }}
    />
  );
}

function InvoicePrintAction({
  invoice,
  canExport,
  centerInfo,
  centerConfigMessage,
  onRetryCenterSettings,
}) {
  const canPrint = canPrintInvoice({ invoice, canExport, centerName: centerInfo?.name });
  if (!canExport) return null;
  if (invoice.status !== INVOICE_STATUS.PAID)
    return (
      <Tooltip title="Chỉ hóa đơn đã thanh toán mới được in">
        <Button block disabled>
          In / lưu PDF
        </Button>
      </Tooltip>
    );
  if (!canPrint) {
    return (
      <Alert
        type="warning"
        showIcon
        message={
          centerConfigMessage ||
          'Thiếu thông tin trung tâm trong cấu hình API; chưa thể in hoá đơn.'
        }
        action={
          onRetryCenterSettings && (
            <Button type="link" onClick={onRetryCenterSettings}>
              Thử lại
            </Button>
          )
        }
      />
    );
  }
  return (
    <Button className="scms-no-print" type="primary" block onClick={() => window.print()}>
      In / lưu PDF
    </Button>
  );
}

function InvoiceDetails({
  invoice,
  centerInfo,
  canExport,
  centerConfigMessage,
  onRetryCenterSettings,
}) {
  const payments = invoice.payments ?? [];
  const receivedAmount = payments.reduce(
    (total, payment) => total + Number(payment.receivedAmount ?? 0),
    0,
  );
  return (
    <Space direction="vertical" size="middle" className="scms-full-width">
      <div
        className={
          canPrintInvoice({ invoice, canExport, centerName: centerInfo?.name })
            ? 'scms-printable'
            : 'scms-no-print'
        }
      >
        <CenterBlock centerInfo={centerInfo} />
        <Typography.Title level={4}>Hoá đơn thanh toán</Typography.Title>
        <InvoiceSummary invoice={invoice} receivedAmount={receivedAmount} />
        <Typography.Title level={5}>Lịch sử thanh toán</Typography.Title>
        <PaymentHistory payments={payments} currency={invoice.currency} />
      </div>
      <InvoicePrintAction
        invoice={invoice}
        canExport={canExport}
        centerInfo={centerInfo}
        centerConfigMessage={centerConfigMessage}
        onRetryCenterSettings={onRetryCenterSettings}
      />
    </Space>
  );
}

function CashAction({ invoice, onCash, canRecordCash }) {
  if (!onCash || !canCollectCash({ invoice, canRecordCash })) return null;
  return (
    <Button type="primary" block onClick={() => onCash(invoice.id)}>
      Thu tiền mặt
    </Button>
  );
}

function ReceiptContent({
  query,
  centerInfo,
  canExport,
  centerConfigMessage,
  onRetryCenterSettings,
  onCash,
  canRecordCash,
}) {
  if (query.isPending) return <PageLoading />;
  if (query.isError) {
    const notice = getApiAvailabilityNotice(query.error, 'Chi tiết hóa đơn');
    return (
      <Alert
        showIcon
        type={notice.type}
        message={notice.message}
        description={notice.description}
        action={notice.retryable && <Button onClick={() => query.refetch()}>Thử lại</Button>}
      />
    );
  }
  const invoice = query.data?.data;
  if (!invoice) return <Empty description="Không tìm thấy hóa đơn" />;
  return (
    <>
      <CashAction invoice={invoice} onCash={onCash} canRecordCash={canRecordCash} />
      <InvoiceDetails
        invoice={invoice}
        centerInfo={invoice.centerInfo ?? centerInfo}
        canExport={canExport}
        centerConfigMessage={
          invoice.centerInfo
            ? 'Cấu hình trung tâm chưa có tên; cần cập nhật trước khi in.'
            : centerConfigMessage
        }
        onRetryCenterSettings={onRetryCenterSettings}
      />
    </>
  );
}

/** Xem chi tiết hoá đơn; chỉ in bản PAID khi đã có cấu hình trung tâm từ API. */
export function InvoiceReceiptModal({
  invoiceId,
  open,
  onClose,
  centerInfo,
  canExport,
  centerConfigMessage,
  onRetryCenterSettings,
  onCash,
}) {
  const { user } = useAuth();
  const { can } = usePermission();
  const query = useQuery({
    queryKey: [...QUERY_KEYS.INVOICES, 'detail', user?.id, invoiceId],
    queryFn: () => paymentService.getInvoice(invoiceId),
    enabled: open && Boolean(invoiceId),
    retry: shouldRetryApiQuery,
  });
  return (
    <Modal
      open={open}
      title="Chi tiết hoá đơn"
      footer={null}
      onCancel={onClose}
      width={MODAL_WIDTH}
    >
      <ReceiptContent
        query={query}
        centerInfo={centerInfo}
        canExport={canExport}
        centerConfigMessage={centerConfigMessage}
        onRetryCenterSettings={onRetryCenterSettings}
        onCash={onCash}
        canRecordCash={can(PERMISSIONS.PAYMENT_RECORD_CASH)}
      />
    </Modal>
  );
}
