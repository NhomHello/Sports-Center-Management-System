import { useState } from 'react';
import { PERMISSIONS } from '@scms/shared';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Space, Table, Tag } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { COURSE_KEYS } from '@/constants/courses';
import { listCoachRatings } from '@/services/course.service';
import { QueryState } from '@/pages/schedule/QueryState';
import { RatingModerationModal } from './RatingModerationModal';

/** HLV chỉ thấy tên viết tắt; danh tính và thao tác kiểm duyệt đều do permission và API quyết định. */
export function CoachRatingsPanel({ coachId }) {
  const { can } = usePermission();
  const { user } = useAuth();
  const table = useTableQuery();
  const [item, setItem] = useState(null);
  const moderation = can(PERMISSIONS.COURSE_RATING_MODERATE);
  const query = useQuery({
    queryKey: [...COURSE_KEYS.RATINGS, user?.id, moderation, coachId, table.params],
    queryFn: () => listCoachRatings(coachId, table.params),
  });
  const columns = [
    { title: 'Người đánh giá', dataIndex: 'memberName' },
    { title: 'Điểm khóa', dataIndex: 'courseStars' },
    { title: 'Điểm HLV', dataIndex: 'coachStars' },
    { title: 'Nhận xét', dataIndex: 'comment', render: (value) => value ?? 'Nhận xét đã được ẩn' },
    {
      title: 'Hiển thị',
      dataIndex: 'hidden',
      render: (value) => <Tag>{value ? 'Đã ẩn' : 'Công khai'}</Tag>,
    },
  ];
  if (moderation)
    columns.push({
      title: 'Thao tác',
      render: (_, row) => (
        <Button onClick={() => setItem(row)}>{row.hidden ? 'Hiện nhận xét' : 'Ẩn nhận xét'}</Button>
      ),
    });
  const averages = query.data?.meta?.averages;
  return (
    <QueryState query={query}>
      <Space vertical className="scms-full-width">
        <RatingAverages averages={averages} />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={query.data?.data ?? []}
          pagination={table.paginationProps(query.data?.meta)}
          onChange={table.onTableChange}
          scroll={{ x: true }}
        />
        {item && <RatingModerationModal item={item} onClose={() => setItem(null)} />}
      </Space>
    </QueryState>
  );
}

function RatingAverages({ averages }) {
  return (
    <Card size="small">
      Trung bình khóa: {averages?.courseStars ?? '—'} · Trung bình HLV:{' '}
      {averages?.coachStars ?? '—'}
    </Card>
  );
}
