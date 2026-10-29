import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS } from '@scms/shared';
import { Alert, Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { COURSE_KEYS } from '@/constants/courses';
import { listRatedCoaches } from '@/services/course.service';
import { CoachRatingsPanel } from './CoachRatingsPanel';
/** HLV xem đánh giá của mình; người kiểm duyệt chọn HLV đã nhận đánh giá. */
export default function CourseRatingsPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const moderation = can(PERMISSIONS.COURSE_RATING_MODERATE);
  const [selected, setSelected] = useState(null);
  const query = useQuery({
    queryKey: [...COURSE_KEYS.RATINGS, 'rated-coaches', user?.id],
    queryFn: listRatedCoaches,
    enabled: moderation,
  });
  const coachId = moderation ? selected : user?.id;
  return (
    <>
      <PageHeader
        title="Đánh giá khóa học và HLV"
        subtitle={
          moderation
            ? 'Kiểm duyệt nhận xét với lý do, giữ nguyên điểm sao.'
            : 'Nhận xét được ẩn danh để hội viên phản hồi thoải mái.'
        }
      />
      {moderation && (
        <Select
          aria-label="HLV được đánh giá"
          placeholder="Chọn HLV"
          loading={query.isPending}
          options={(query.data?.data ?? []).map((row) => ({ value: row.id, label: row.fullName }))}
          onChange={setSelected}
        />
      )}
      {query.isError && <Alert type="error" title={query.error.message} />}
      {coachId && <CoachRatingsPanel key={coachId} coachId={coachId} />}
    </>
  );
}
