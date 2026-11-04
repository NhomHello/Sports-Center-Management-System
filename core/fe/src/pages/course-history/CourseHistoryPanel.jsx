import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Input, Pagination, Row, Space, Tag, Typography } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { useTableQuery } from '@/hooks/useTableQuery';
import { listCourseHistory } from '@/services/courseHistory.service';
import { formatDate } from '@/utils/format';
import { COURSE_ENROLLMENT_LABELS } from '@/utils/courseHistory';
import { QueryState } from '@/pages/schedule/QueryState';
import { CourseHistoryDetail } from './CourseHistoryDetail';

function CourseCard({ item, onSelect }) {
  return (
    <Card title={<Typography.Text strong>{item.name}</Typography.Text>}>
      <Space orientation="vertical">
        <Tag>{COURSE_ENROLLMENT_LABELS[item.enrollmentStatus] ?? 'Khóa học trong lịch sử'}</Tag>
        <Typography.Text>
          {item.subject} · {item.totalSessions} buổi
        </Typography.Text>
        <Typography.Text type="secondary">
          {formatDate(item.startsOn)} – {formatDate(item.endsOn)}
        </Typography.Text>
        <Button type="primary" onClick={() => onSelect(item.id)}>
          Xem các buổi học
        </Button>
      </Space>
    </Card>
  );
}

/** Chọn khóa trước rồi xem tất cả buổi; dùng chung cho chính chủ và hồ sơ hội viên của admin. */
export function CourseHistoryPanel({ memberId }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const table = useTableQuery();
  const query = useQuery({
    queryKey: ['course-history-list', user?.id, memberId, table.params],
    queryFn: () => listCourseHistory(table.params, memberId),
    enabled: selected === null,
  });
  if (selected)
    return (
      <CourseHistoryDetail
        key={`${memberId}-${selected}`}
        classId={selected}
        memberId={memberId}
        onBack={() => setSelected(null)}
      />
    );
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Typography.Paragraph>
        Chọn một khóa học để xem thời gian, điểm danh và nhận xét của từng buổi.
      </Typography.Paragraph>
      <Input.Search
        allowClear
        aria-label="Tìm khóa học trong lịch sử"
        placeholder="Tìm theo tên khóa học"
        onSearch={(search) => table.setFilters({ search })}
      />
      <QueryState query={query} isEmpty={query.isSuccess && !query.data?.data.length}>
        <Row gutter={[16, 16]} className="scms-full-width">
          {query.data?.data.map((item) => (
            <Col key={item.id} xs={24} lg={12}>
              <CourseCard item={item} onSelect={setSelected} />
            </Col>
          ))}
        </Row>
        <Pagination
          {...table.paginationProps(query.data?.meta)}
          onChange={(current, pageSize) => table.onTableChange({ current, pageSize })}
        />
      </QueryState>
    </Space>
  );
}
