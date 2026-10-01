/* eslint-disable max-lines-per-function -- Bỏ giới hạn dòng theo yêu cầu Sprint 1. */
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Segmented } from 'antd';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { QUERY_KEYS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as paymentService from '@/services/payment.service';
import { shouldRetryApiQuery } from '@/utils/apiAvailability';
import { getInvoiceListErrorNotice } from '@/utils/invoice';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import { InvoiceTable } from './InvoiceTable';
import { InvoiceFilters } from './InvoiceFilters';
import { CounterInvoiceModal } from './CounterInvoiceModal';
import { InvoiceCashModal } from './InvoiceCashModal';

function InvoiceListContent({ query, isOwn, table, onCash, onDetail }) {
  if (query.isError) {
    const notice = getInvoiceListErrorNotice(query.error, !isOwn);
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
  return (
    <InvoiceTable
      invoices={query.data?.data ?? []}
      loading={query.isPending}
      pagination={table.paginationProps(query.data?.meta)}
      onChange={table.onTableChange}
      onCash={onCash}
      onDetail={onDetail}
    />
  );
}

function InvoiceWorkspace({
  query,
  canReadAll,
  showOwn,
  isOwn,
  table,
  onScopeChange,
  onCash,
  onDetail,
}) {
  const notice = query.isError ? getInvoiceListErrorNotice(query.error, !isOwn) : null;
  return (
    <Card variant="borderless" className="scms-workspace-card">
      <div className="scms-invoice-toolbar">
        <div className="scms-invoice-toolbar__primary">
          {canReadAll && (
            <Segmented
              value={showOwn}
              options={[
                { value: false, label: 'Mọi hóa đơn' },
                { value: true, label: 'Hóa đơn của tôi' },
              ]}
              onChange={onScopeChange}
            />
          )}
          <InvoiceFilters
            key={`${isOwn}:${table.filters.search ?? ''}`}
            filters={table.filters}
            onChange={table.setFilters}
            loading={query.isFetching}
          />
        </div>
        <Button
          icon={<ReloadOutlined />}
          loading={query.isFetching}
          disabled={notice?.retryable === false}
          onClick={() => query.refetch()}
        >
          Làm mới
        </Button>
      </div>
      <InvoiceListContent
        query={query}
        isOwn={isOwn}
        table={table}
        onCash={onCash}
        onDetail={onDetail}
      />
    </Card>
  );
}

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
    queryFn: () => paymentService.listInvoices(table.params, isOwn),
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
