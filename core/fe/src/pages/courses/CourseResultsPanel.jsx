import { useState } from 'react';
import { PERMISSIONS } from '@scms/shared';
import { usePermission } from '@/hooks/usePermission';
import { CourseRatingModal } from './CourseRatingModal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { App, Button, Empty, Space, Table, Tag } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { COURSE_KEYS, RESULT_LABELS } from '@/constants/courses';
import { listOwnResults, downloadCourseResult } from '@/services/course.service';
import { downloadFile } from '@/utils/downloadFile';
import { QueryState } from '@/pages/schedule/QueryState';
import { CourseResultDetails } from './CourseResultDetails';

/** S38: chỉ lấy dữ liệu chính chủ đã công bố, PDF dùng cùng snapshot với màn hình. */
export function CourseResultsPanel() {
  const { user } = useAuth();
  const { can } = usePermission();
  const [ratingItem, setRatingItem] = useState(null);
  const { message } = App.useApp();
  const table = useTableQuery();
  const query = useQuery({
    queryKey: [...COURSE_KEYS.RESULTS, user?.id, table.params],
    queryFn: () => listOwnResults(table.params),
  });
  const download = useMutation({
    mutationFn: async (item) => ({
      blob: await downloadCourseResult(item.id),
      filename: `course-result-${item.lookupCode}.pdf`,
    }),
    onSuccess: ({ blob, filename }) => downloadFile(blob, filename),
    onError: (error) => message.error(error.message),
  });
  const columns = [
    { title: 'Khóa học', dataIndex: ['summary', 'gymClass', 'name'] },
    { title: 'HLV', render: (_, row) => row.summary.coach.fullName },
    { title: 'Chuyên cần', dataIndex: ['attendanceSnapshot', 'percent'], render: (v) => `${v}%` },
    { title: 'Kết quả', dataIndex: 'result', render: (v) => <Tag>{RESULT_LABELS[v]}</Tag> },
    { title: 'Mức tiến bộ', dataIndex: 'progress', render: (v) => `${v}/5` },
    {
      title: 'Thao tác',
      render: (_, row) => (
        <Button
          loading={download.isPending && download.variables?.id === row.id}
          disabled={download.isPending}
          onClick={() => download.mutate(row)}
        >
          Tải phiếu PDF
        </Button>
      ),
    },
  ];
  if (can(PERMISSIONS.COURSE_RATING_WRITE_OWN))
    columns.push({
      title: 'Đánh giá',
      render: (_, row) => <Button onClick={() => setRatingItem(row)}>Đánh giá khóa học</Button>,
    });
  return (
    <Space vertical className="scms-full-width">
      <QueryState query={query}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data ?? []}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: true }}
          expandable={{ expandedRowRender: (item) => <CourseResultDetails item={item} /> }}
          locale={{
            emptyText: (
              <Empty description="Chưa có tổng kết đã công bố. Khóa chưa công bố hoặc vừa mở lại sẽ không xuất hiện." />
            ),
          }}
        />
      </QueryState>
      {ratingItem && <CourseRatingModal item={ratingItem} onClose={() => setRatingItem(null)} />}
    </Space>
  );
}
