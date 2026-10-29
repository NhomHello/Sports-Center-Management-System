import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { Link } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { ROUTES } from '@/constants';
import { COURSE_KEYS, SUMMARY_LABELS } from '@/constants/courses';
import { listSummaries } from '@/services/course.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from '@/pages/schedule/QueryState';

/** Danh sách đầu vào của S37, bao gồm bản đã công bố để HLV xem lại. */
export default function CourseSummariesPage() {
  const { user } = useAuth();
  const table = useTableQuery();
  const query = useQuery({
    queryKey: [...COURSE_KEYS.SUMMARIES, 'list', user?.id, table.params],
    queryFn: () => listSummaries(table.params),
  });
  const columns = [
    { title: 'Khóa học', dataIndex: ['gymClass', 'name'] },
    { title: 'HLV', render: (_, row) => row.coach.fullName },
    { title: 'Hội viên', dataIndex: ['_count', 'items'] },
    { title: 'Trạng thái', dataIndex: 'status', render: (v) => <Tag>{SUMMARY_LABELS[v]}</Tag> },
    { title: 'Hạn nộp', dataIndex: 'deadlineAt', render: formatDateTime },
    {
      title: 'Thao tác',
      render: (_, row) => (
        <Link to={ROUTES.COURSE_SUMMARY.replace(':id', row.classId)}>
          <Button>Mở tổng kết</Button>
        </Link>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Tổng kết khóa học"
        subtitle="Theo dõi và hoàn thành tổng kết các lớp trong phạm vi được cấp."
      />
      <Space wrap>
        <Input.Search
          aria-label="Tìm tổng kết"
          placeholder="Tìm tên khóa học"
          allowClear
          onSearch={(q) => table.setFilters({ q })}
        />
        <Select
          aria-label="Trạng thái tổng kết"
          placeholder="Tất cả trạng thái"
          allowClear
          options={Object.entries(SUMMARY_LABELS).map(([value, label]) => ({ value, label }))}
          onChange={(status) => table.setFilters({ status })}
        />
      </Space>
      <QueryState query={query}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data ?? []}
          loading={query.isPending}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: true }}
        />
      </QueryState>
    </>
  );
}
