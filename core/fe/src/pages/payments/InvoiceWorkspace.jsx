import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Segmented } from 'antd';
import { getInvoiceListErrorNotice } from '@/utils/invoice';
import { InvoiceFilters } from './InvoiceFilters';
import { InvoiceTable } from './InvoiceTable';

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
      showMember={!isOwn}
    />
  );
}

/** Bộ lọc + bảng hóa đơn; nhân viên chuyển giữa "Mọi hóa đơn" và "Do tôi tạo". */
export function InvoiceWorkspace({
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
                { value: true, label: 'Do tôi tạo' },
              ]}
              onChange={onScopeChange}
            />
          )}
          <InvoiceFilters
            key={`${isOwn}:${table.filters.search ?? ''}`}
            staff={canReadAll}
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
