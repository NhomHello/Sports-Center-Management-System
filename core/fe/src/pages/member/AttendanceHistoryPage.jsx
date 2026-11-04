import { PageHeader } from '@/components/common/PageHeader';
import { CourseHistoryPanel } from '@/pages/course-history/CourseHistoryPanel';

/** Lịch học được nhóm theo khóa, điểm danh và nhận xét nằm cùng dòng buổi học. */
export default function AttendanceHistoryPage() {
  return (
    <>
      <PageHeader
        title="Điểm danh và nhận xét theo khóa học"
        subtitle="Chọn khóa học để xem đầy đủ các buổi và kết quả của chính bạn."
      />
      <CourseHistoryPanel />
    </>
  );
}
