/* eslint-disable max-lines-per-function -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { PlusOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Tabs } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as paymentService from '@/services/payment.service';
import { shouldRetryApiQuery } from '@/utils/apiAvailability';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import { CounterInvoiceModal } from './CounterInvoiceModal';
import { PaymentHistoryPanel } from './PaymentHistoryPanel';
import { RefundList } from './RefundsPanel';
import { InvoiceWorkspace } from './InvoiceWorkspace';
import { InvoiceCashModal } from './InvoiceCashModal';

/** Tab hóa đơn luôn có; lịch sử giao dịch và hoàn tiền chỉ hiện khi có quyền. */
const buildTabs = ({ can, workspace }) =>
  [
    {
      key: 'invoices',
      label: 'Hóa đơn',
      children: workspace,
    },
    can(PERMISSIONS.PAYMENT_READ_ALL, PERMISSIONS.PAYMENT_READ_OWN) && {
      key: 'payments',
      label: 'Lịch sử giao dịch',
      children: <PaymentHistoryPanel />,
    },
    can(PERMISSIONS.PAYMENT_REFUND) && {
      key: 'refunds',
      label: 'Theo dõi hoàn tiền',
      children: (
        <Card variant="borderless" className="scms-workspace-card">
          <RefundList />
        </Card>
      ),
    },
  ].filter(Boolean);

/** S16/S30: tạo hóa đơn, xác nhận thu tiền, tra cứu và in theo quyền API. */
export default function PaymentsPage() {
  const { can } = usePermission();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const table = useTableQuery();
  const requestedInvoiceId = Number(searchParams.get('invoice'));
  const [invoiceId, setInvoiceId] = useState(
    Number.isSafeInteger(requestedInvoiceId) && requestedInvoiceId > 0 ? requestedInvoiceId : null,
  );
  const [cashInvoiceId, setCashInvoiceId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showOwn, setShowOwn] = useState(false);
  const canReadAll = can(PERMISSIONS.INVOICE_READ_ALL);
  const canCreate =
    can(PERMISSIONS.MEMBERSHIP_MANAGE) &&
    can(PERMISSIONS.MEMBER_READ) &&
    can(PERMISSIONS.MEMBERSHIP_PLAN_READ);
  const isOwn = !canReadAll || showOwn;
  const query = useQuery({
    queryKey: [...QUERY_KEYS.INVOICES, 'list', user?.id, isOwn, table.params],
    queryFn: () =>
      paymentService.listInvoices(
        { ...table.params, ...(canReadAll && showOwn && { createdByMe: true }) },
        !canReadAll,
      ),
    enabled: can(PERMISSIONS.INVOICE_READ_OWN, PERMISSIONS.INVOICE_READ_ALL),
    retry: shouldRetryApiQuery,
  });
  const handleCreated = (id) => {
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVOICES });
    if (can(PERMISSIONS.PAYMENT_RECORD_CASH)) setCashInvoiceId(id);
    else setInvoiceId(id);
  };
  const closeReceipt = () => {
    setInvoiceId(null);
    if (searchParams.has('invoice')) {
      const next = new URLSearchParams(searchParams);
      next.delete('invoice');
      setSearchParams(next, { replace: true });
    }
  };
  const workspace = (
    <InvoiceWorkspace
      query={query}
      canReadAll={canReadAll}
      showOwn={showOwn}
      isOwn={isOwn}
      table={table}
      onScopeChange={(value) => {
        setShowOwn(value);
        table.setFilters({});
      }}
      onCash={setCashInvoiceId}
      onDetail={setInvoiceId}
    />
  );
  return (
    <>
      <PageHeader
        title="Hóa đơn"
        subtitle={
          isOwn
            ? 'Hóa đơn và lịch sử thanh toán của bạn'
            : 'Tạo hóa đơn và ghi nhận thanh toán tại quầy'
        }
        extra={
          canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
              Tạo hóa đơn tại quầy
            </Button>
          )
        }
      />
      <Tabs className="scms-payments-tabs" destroyOnHidden items={buildTabs({ can, workspace })} />
      {canCreate && (
        <CounterInvoiceModal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
      <InvoiceCashModal
        invoiceId={cashInvoiceId}
        onClose={() => setCashInvoiceId(null)}
        onPaid={(id) => {
          setCashInvoiceId(null);
          setInvoiceId(id);
        }}
      />
      <InvoiceReceiptModal
        invoiceId={invoiceId}
        open={Boolean(invoiceId)}
        onClose={closeReceipt}
        canExport={can(PERMISSIONS.INVOICE_EXPORT)}
        onCash={(id) => {
          setInvoiceId(null);
          setCashInvoiceId(id);
        }}
      />
    </>
  );
}
