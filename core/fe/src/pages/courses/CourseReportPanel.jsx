import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DownloadButton } from '@/components/common/DownloadButton';
import { App, Card, Space } from 'antd';
import { COURSE_KEYS } from '@/constants/courses';
import { useAuth } from '@/hooks/useAuth';
import { getCourseReport, downloadCourseReport } from '@/services/course.service';
import { vietnamInput } from '@/utils/schedule';
import { downloadFile } from '@/utils/downloadFile';
import { QueryState } from '@/pages/schedule/QueryState';
import { CourseReportFilters } from './CourseReportFilters';
import { CourseReportTable } from './CourseReportTable';

/** S39: quyền riêng, bộ lọc đã áp dụng được chụp lại cho mỗi lần xuất Excel. */
export function CourseReportPanel() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const today = vietnamInput(new Date());
  const [filters, setFilters] = useState({
    from: today.startOf('month').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  });
  const query = useQuery({
    queryKey: [...COURSE_KEYS.REPORT, 'data', user?.id, filters],
    queryFn: () => getCourseReport(filters),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (params) => ({ blob: await downloadCourseReport(params), params }),
    onSuccess: ({ blob, params }) =>
      downloadFile(blob, `course-summaries-${params.from}-${params.to}.xlsx`),
    onError: (error) => message.error(error.message),
  });
  const report = query.data?.data;
  return (
    <Space vertical className="scms-full-width">
      <CourseReportFilters today={today} onApply={setFilters} />
      <QueryState query={query}>
        {report && (
          <>
            <Card title="Tình trạng tổng kết khóa">
              Tổng khóa: {report.total} · Đã nộp: {report.published} · Tỉ lệ hoàn thành:{' '}
              {report.completionPercent.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%
            </Card>
            <DownloadButton
              onClick={() => mutation.mutate({ ...filters })}
              pending={mutation.isPending}
            >
              Xuất Excel tổng kết
            </DownloadButton>
            <CourseReportTable report={report} />
          </>
        )}
      </QueryState>
    </Space>
  );
}
