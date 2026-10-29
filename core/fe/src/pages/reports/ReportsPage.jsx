import { PERMISSIONS } from '@scms/shared';
import { Tabs } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { usePermission } from '@/hooks/usePermission';
import { FinancialReportsPanel } from './FinancialReportsPanel';
import { CourseReportPanel } from '@/pages/courses/CourseReportPanel';

/** Quyền báo cáo tài chính và tổng kết khóa độc lập; không gọi API tab không được cấp. */
export default function ReportsPage() {
  const { can } = usePermission();
  const items = [
    can(PERMISSIONS.REPORT_VIEW) && {
      key: 'finance',
      label: 'Tài chính & hội viên',
      children: <FinancialReportsPanel />,
    },
    can(PERMISSIONS.COURSE_SUMMARY_VIEW_ALL) && {
      key: 'courses',
      label: 'Tổng kết khóa',
      children: <CourseReportPanel />,
    },
  ].filter(Boolean);
  return (
    <>
      <PageHeader
        title="Báo cáo trung tâm"
        subtitle="Báo cáo theo quyền truy cập và bộ lọc đã áp dụng · Giờ Việt Nam"
      />
      {items.length > 1 ? <Tabs items={items} destroyOnHidden /> : items[0]?.children}
    </>
  );
}
