import { useQuery } from '@tanstack/react-query';
import { Alert, DatePicker, Flex, Input, Table, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { DATE_FORMATS } from '@/constants';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listAudit } from '@/services/payment.service';
import { formatDateTime } from '@/utils/format';

const columns = [
  { title: 'Thời điểm', dataIndex: 'createdAt', render: formatDateTime },
  {
    title: 'Người thực hiện',
    dataIndex: ['user', 'fullName'],
    render: (value) => value || 'Hệ thống',
  },
  { title: 'Thao tác', dataIndex: 'action' },
  { title: 'Đối tượng', dataIndex: 'entity' },
  { title: 'Mã đối tượng', dataIndex: 'entityId' },
];

/** S28: tra cứu nhật ký chỉ đọc theo người, thời gian và đối tượng. */
export default function AuditPage() {
  const table = useTableQuery();
  const query = useQuery({
    queryKey: ['audit', table.params],
    queryFn: () => listAudit(table.params),
  });
  return (
    <>
      <PageHeader
        title="Nhật ký thao tác"
        subtitle="Lịch sử thay đổi được giữ nguyên để tra cứu."
      />
      <Flex wrap gap="middle">
        <Input.Search
          placeholder="Tên người thực hiện"
          allowClear
          onSearch={(search) => table.setFilters({ search })}
        />
        <Input
          placeholder="Thao tác"
          onChange={(e) => table.setFilters({ action: e.target.value || undefined })}
        />
        <Input
          placeholder="Đối tượng"
          onChange={(e) => table.setFilters({ entity: e.target.value || undefined })}
        />
        <Input
          placeholder="Mã đối tượng"
          onChange={(e) => table.setFilters({ entityId: e.target.value || undefined })}
        />
        <DatePicker.RangePicker
          format={DATE_FORMATS.DATE}
          onChange={(dates) =>
            table.setFilters({
              from: dates?.[0].startOf('day').toISOString(),
              to: dates?.[1].endOf('day').toISOString(),
            })
          }
        />
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
        expandable={{
          expandedRowRender: (row) => (
            <Typography.Paragraph>
              <pre>{JSON.stringify(row.meta, null, 2)}</pre>
            </Typography.Paragraph>
          ),
        }}
      />
    </>
  );
}
