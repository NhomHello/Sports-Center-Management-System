import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { App } from 'antd';
import { vietnamInput } from '@/utils/schedule';
import { PageHeader } from '@/components/common/PageHeader';
import { ReportFilters } from './ReportFilters';
import { getReport, exportReport } from '@/services/sprint3.service';
import { ReportResults } from './ReportResults';
import { QueryState } from '../schedule/QueryState';

/** Dashboard và tệp xuất dùng cùng bộ lọc đã áp dụng, không tính lại tiền ở client. */
export default function ReportsPage() {
  const { message } = App.useApp();
  const today = vietnamInput(new Date());
  const [filters, setFilters] = useState({
    from: today.startOf('month').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
  });
  const [format, setFormat] = useState('xlsx');
  const query = useQuery({ queryKey: ['reports', filters], queryFn: () => getReport(filters) });
  const download = useMutation({
    mutationFn: () => exportReport({ ...filters, format }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${filters.from}-${filters.to}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => message.error(e.message),
  });
  const report = query.data?.data;
  return (
    <>
      <PageHeader
        title="Báo cáo trung tâm"
        subtitle="Doanh thu theo ngày thanh toán, trừ tiền đã hoàn · Giờ Việt Nam"
      />
      <ReportFilters today={today} onApply={setFilters} />
      <QueryState query={query}>
        {report && (
          <ReportResults
            report={report}
            format={format}
            setFormat={setFormat}
            download={download}
          />
        )}
      </QueryState>
    </>
  );
}
