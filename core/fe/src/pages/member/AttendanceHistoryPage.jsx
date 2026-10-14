import { useQuery } from '@tanstack/react-query';
import { DatePicker, InputNumber, Select, Space, Table } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { DATE_FORMATS } from '@/constants';
import { useTableQuery } from '@/hooks/useTableQuery';
import { getOwnAttendance } from '@/services/sprint3.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from '../schedule/QueryState';

/** Lịch sử chỉ đọc của người dùng hiện tại. */
export default function AttendanceHistoryPage() {
  const table = useTableQuery();
  const query = useQuery({
    queryKey: ['attendance-own', table.params],
    queryFn: () => getOwnAttendance(table.params),
  });
  return (
    <>
      <PageHeader title="Lịch sử điểm danh của tôi" />
      <Space wrap>
        <DatePicker.RangePicker
          format={DATE_FORMATS.DATE}
          onChange={(range) =>
            table.setFilters({
              from: range?.[0].format('YYYY-MM-DD'),
              to: range?.[1].format('YYYY-MM-DD'),
            })
          }
        />
        <InputNumber
          aria-label="Mã lớp"
          placeholder="Mã lớp"
          min={1}
          precision={0}
          onChange={(classId) => table.setFilters({ classId: classId || undefined })}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 160 }}
          onChange={(status) => table.setFilters({ status })}
          options={[
            { value: 'PRESENT', label: 'Có mặt' },
            { value: 'ABSENT', label: 'Vắng mặt' },
          ]}
        />
      </Space>
      <QueryState query={query}>
        <Table
          rowKey="id"
          dataSource={query.data?.data}
          loading={query.isFetching}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: 600 }}
          columns={[
            { title: 'Lớp', dataIndex: ['session', 'gymClass', 'name'] },
            { title: 'Buổi học', render: (_, row) => formatDateTime(row.session.startAt) },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              render: (v) => (v === 'PRESENT' ? 'Có mặt' : 'Vắng mặt'),
            },
            { title: 'Người ghi', dataIndex: ['actor', 'fullName'] },
          ]}
        />
      </QueryState>
    </>
  );
}
