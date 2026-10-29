import { useQuery } from '@tanstack/react-query';
import { Descriptions, Space, Tag } from 'antd';
import { PERMISSIONS } from '@scms/shared';
import { useParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { COURSE_KEYS, SUMMARY_LABELS, SUMMARY_STATUS } from '@/constants/courses';
import { getSummary } from '@/services/course.service';
import { formatDateTime } from '@/utils/format';
import { QueryState } from '@/pages/schedule/QueryState';
import { SummaryStudents } from './SummaryStudents';

/** S37: quản lý chỉ đọc; chỉ HLV tác giả được sửa bản nháp. */
export default function CourseSummaryPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { can } = usePermission();
  const query = useQuery({
    queryKey: [...COURSE_KEYS.SUMMARIES, user?.id, id],
    queryFn: () => getSummary(id),
    retry: false,
  });
  const summary = query.data?.data;
  const canEdit =
    summary?.coachId === user?.id &&
    can(PERMISSIONS.COURSE_SUMMARY_MANAGE_ASSIGNED) &&
    summary?.status === SUMMARY_STATUS.DRAFT;
  return (
    <>
      <PageHeader
        title={summary ? `Tổng kết · ${summary.gymClass.name}` : 'Tổng kết khóa học'}
        subtitle="Chuyên cần được tính từ lịch học và điểm danh thực tế."
      />
      <QueryState query={query}>
        {summary && (
          <Space vertical className="scms-full-width">
            <Descriptions
              bordered
              items={[
                { key: 'responsible', label: 'HLV phụ trách', children: summary.coach.fullName },
                {
                  key: 'status',
                  label: 'Trạng thái',
                  children: <Tag>{SUMMARY_LABELS[summary.status]}</Tag>,
                },
                { key: 'deadline', label: 'Hạn nộp', children: formatDateTime(summary.deadlineAt) },
                { key: 'revision', label: 'Lần công bố', children: summary.revision },
              ]}
            />
            <SummaryStudents summary={summary} canEdit={canEdit} />
          </Space>
        )}
      </QueryState>
    </>
  );
}
