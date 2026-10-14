import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Flex, Select, Switch, Table, Tag } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useTableQuery } from '@/hooks/useTableQuery';
import { CASE_REASON_LABELS, CASE_STATUS_LABELS } from '@/constants/reconciliation';
import { listCases } from '@/services/reconciliation.service';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { CaseDrawer } from './CaseDrawer';

const options = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));
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
    { title: 'Hội viên', dataIndex: ['member', 'fullName'] },
    { title: 'Hóa đơn', dataIndex: ['invoice', 'code'] },
    { title: 'Lý do', dataIndex: 'reason', render: (value) => CASE_REASON_LABELS[value] ?? value },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (value) => <Tag>{CASE_STATUS_LABELS[value]}</Tag>,
    },
    { title: 'Số tiền', dataIndex: 'amount', align: 'right', render: formatCurrency },
    { title: 'Ngày nhận', dataIndex: 'createdAt', render: formatDateTime },
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
      <Flex wrap gap="middle">
        <Select
          aria-label="Lý do đối soát"
          placeholder="Tất cả lý do"
          allowClear
          options={options(CASE_REASON_LABELS)}
          onChange={(reason) => table.setFilters({ reason })}
        />
        <Select
          aria-label="Trạng thái phiếu"
          placeholder="Phiếu đang mở"
          allowClear
          options={options(CASE_STATUS_LABELS)}
          onChange={(status) => table.setFilters({ status })}
        />
        <Switch
          checkedChildren="Quá hạn"
          unCheckedChildren="Mọi thời điểm"
          onChange={(overdue) => table.setFilters({ overdue: overdue || undefined })}
        />
        <Button onClick={() => query.refetch()} loading={query.isFetching}>
          Làm mới
        </Button>
      </Flex>
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
      <CaseDrawer id={id} onClose={() => setId(null)} />
    </>
  );
}
