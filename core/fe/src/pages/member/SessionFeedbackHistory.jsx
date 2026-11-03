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
          scroll={{ x: 1100 }}
          columns={[
            {
              title: 'Khóa học',
              width: 220,
              ellipsis: true,
              render: (_, row) => row.session.gymClass.name,
            },
            {
              title: 'Buổi học',
              width: 160,
              render: (_, row) => formatDateTime(row.session.startAt),
            },
            {
              title: 'Đánh giá',
              render: (_, row) => (row.rating ? <Rate value={row.rating} disabled /> : '—'),
            },
            { title: 'Nhận xét', width: 360, dataIndex: 'note' },
            {
              title: 'Người nhận xét',
              width: 200,
              ellipsis: true,
              render: (_, row) => row.author.fullName,
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}
