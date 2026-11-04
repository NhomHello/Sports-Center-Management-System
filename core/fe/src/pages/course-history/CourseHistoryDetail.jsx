import { useQuery } from '@tanstack/react-query';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { useAuth } from '@/hooks/useAuth';
import { getCourseHistory } from '@/services/courseHistory.service';
import { COURSE_ENROLLMENT_LABELS } from '@/utils/courseHistory';
import { QueryState } from '@/pages/schedule/QueryState';
import { CourseSessionTable } from './CourseSessionTable';
const REFRESH_MS = 10000;

/** Một khóa hiển thị một bảng hợp nhất; đổi khóa không để lộ dữ liệu người được xem trước đó. */
export function CourseHistoryDetail({ classId, memberId, onBack }) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['course-history', user?.id, memberId, classId],
    queryFn: () => getCourseHistory(classId, memberId),
    refetchInterval: REFRESH_MS,
  });
  const data = query.data?.data;
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Danh sách khóa học
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => query.refetch()}
          loading={query.isFetching}
        >
          Cập nhật kết quả
        </Button>
      </Space>
      <QueryState query={query}>
        {data && (
          <Card>
            <Typography.Title level={4}>{data.course.name}</Typography.Title>
            <Space wrap>
              <Tag>{data.member.fullName}</Tag>
              <Tag color="blue">{data.sessions.length} buổi học</Tag>
              <Tag>
                {COURSE_ENROLLMENT_LABELS[data.course.enrollmentStatus] ?? 'Khóa học trong lịch sử'}
              </Tag>
            </Space>
            <Typography.Paragraph type="secondary">
              Các buổi theo thứ tự thời gian, giờ Việt Nam. Buổi chưa điểm danh không được tính là
              vắng mặt.
            </Typography.Paragraph>
            <CourseSessionTable sessions={data.sessions} asOf={data.asOf} />
          </Card>
        )}
      </QueryState>
    </Space>
  );
}
