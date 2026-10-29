import { PERMISSIONS } from '@scms/shared';
import { Button } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { CLASS_STATUS } from '@/constants/schedule';
import { usePermission } from '@/hooks/usePermission';
/** Lối vào từ lớp đã hoàn thành; API vẫn xác nhận tác giả của bản tổng kết. */
export function CourseSummaryLink({ item }) {
  const { can } = usePermission();
  if (
    item?.status !== CLASS_STATUS.COMPLETED ||
    !can(PERMISSIONS.COURSE_SUMMARY_MANAGE_ASSIGNED, PERMISSIONS.COURSE_SUMMARY_VIEW_ALL)
  )
    return null;
  return (
    <Link to={ROUTES.COURSE_SUMMARY.replace(':id', item.id)}>
      <Button>Xem tổng kết</Button>
    </Link>
  );
}
