import { useQuery } from '@tanstack/react-query';
import { Card, Rate, Table } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { getOwnSessionFeedback } from '@/services/sessionFeedback.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from '../schedule/QueryState';
/** Chỉ đọc ghi chú của chính mình; ID hội viên không được truyền trong URL. */
export function SessionFeedbackHistory() {
  const { user } = useAuth();
  const table = useTableQuery();
  const query = useQuery({
    queryKey: ['own-session-feedback', user?.id, table.params],
    queryFn: () => getOwnSessionFeedback(table.params),
  });
  return (
    <Card title="Nhận xét của HLV theo buổi" style={{ marginTop: 20 }}>
      <QueryState query={query}>
        <Table
          rowKey="id"
          dataSource={query.data?.data ?? []}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: 720 }}
          columns={[
            { title: 'Khóa học', render: (_, row) => row.session.gymClass.name },
            { title: 'Buổi học', render: (_, row) => formatDateTime(row.session.startAt) },
            {
              title: 'Đánh giá',
              render: (_, row) => (row.rating ? <Rate value={row.rating} disabled /> : '—'),
            },
            { title: 'Nhận xét', dataIndex: 'note' },
            { title: 'Người nhận xét', render: (_, row) => row.author.fullName },
          ]}
        />
      </QueryState>
    </Card>
  );
}
