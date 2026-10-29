import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { App, Tabs } from 'antd';
import { getMemberReport, downloadMemberReport } from '@/services/report.service';
import { MemberReportResults } from './MemberReportResults';
import './reports.css';
import { vietnamInput } from '@/utils/schedule';
import { ReportFilters } from './ReportFilters';
import { getReport, exportReport } from '@/services/sprint3.service';
import { ReportResults } from './ReportResults';
import { QueryState } from '../schedule/QueryState';

/** Dashboard và tệp xuất dùng cùng bộ lọc đã áp dụng, không tính lại tiền ở client. */
export function FinancialReportsPanel() {
  const { message } = App.useApp();
  const today = vietnamInput(new Date());
  const [filters, setFilters] = useState({
    from: today.startOf('month').format('YYYY-MM-DD'),
    to: today.format('YYYY-MM-DD'),
    groupBy: 'day',
    compare: 'previous',
  });
  const [format, setFormat] = useState('xlsx');
  const [tab, setTab] = useState('revenue');
  const query = useQuery({
    queryKey: ['reports', tab, filters],
    queryFn: () => (tab === 'members' ? getMemberReport(filters) : getReport(filters)),
  });
  const download = useMutation({
    mutationFn: async ({ params, activeTab }) => ({
      blob: await (activeTab === 'members' ? downloadMemberReport(params) : exportReport(params)),
      filename: `${activeTab}-${params.from}-${params.to}.${params.format}`,
    }),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => message.error(e.message),
  });
  const report = query.data?.data;
  const Results = tab === 'members' ? MemberReportResults : ReportResults;
  return (
    <>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'revenue', label: 'Doanh thu' },
          { key: 'members', label: 'Hội viên & đăng ký' },
        ]}
      />
      <ReportFilters today={today} onApply={setFilters} />
      <QueryState query={query}>
        {report && (
          <Results
            report={report}
            format={format}
            setFormat={setFormat}
            download={{
              isPending: download.isPending,
              mutate: () => download.mutate({ params: { ...filters, format }, activeTab: tab }),
            }}
          />
        )}
      </QueryState>
    </>
  );
}
